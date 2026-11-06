import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { Pool } from "pg";

export interface Operation { state: string; details: Record<string, any> }
export interface OperationStore {
  reserve(key: string, details: Record<string, any>): Promise<boolean>;
  get(key: string): Promise<Operation | undefined>;
  save(key: string, state: string, details: Record<string, any>): Promise<void>;
}
let pool: Pool;
function database() {
  return pool ||= new Pool({ connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 15000,
    ssl: process.env.DATABASE_SSL === "true" ? {
      ...(process.env.DATABASE_SSL_CA_FILE ? { ca: readFileSync(process.env.DATABASE_SSL_CA_FILE, "utf8") } : {}),
      rejectUnauthorized: process.env.DATABASE_SSL_STRICT !== "false",
    } : false });
}
export const operationStore: OperationStore = {
  async reserve(key, details) {
    const result = await database().query(`insert into payment_operation(id,operation_key,state,details) values($1,$2,'reserved',$3) on conflict(operation_key) do nothing returning id`, [`payop_${randomUUID().replaceAll("-", "")}`, key, JSON.stringify(details)]);
    return result.rowCount === 1;
  },
  async get(key) { return (await database().query(`select state,details from payment_operation where operation_key=$1 and deleted_at is null`, [key])).rows[0]; },
  async save(key, state, details) {
    await database().query(`update payment_operation set state=$2,details=$3,updated_at=now() where operation_key=$1`, [key, state, JSON.stringify(details)]);
  },
};

// Reserve BEFORE any external mutation. A crash or timeout leaves a durable
// reservation; neither another request nor another process can charge again.
export async function performOnce<T>(store: OperationStore, key: string, details: Record<string, any>, work: () => Promise<T>): Promise<T> {
  if (!await store.reserve(key, details)) {
    const previous = await store.get(key);
    if (previous?.state === "submitted") return previous.details.result as T;
    throw new Error("Payment outcome requires reconciliation; another bank request will not be created");
  }
  let result: T;
  try { result = await work(); }
  catch (error) {
    await store.save(key, "uncertain", details);
    throw error;
  }
  // If persisting fails after bank success, keep the reservation, never retry.
  await store.save(key, "submitted", { ...details, result });
  return result;
}
