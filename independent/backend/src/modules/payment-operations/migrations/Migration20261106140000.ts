import { Migration } from "@medusajs/framework/mikro-orm/migrations";
export class Migration20261106140000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "payment_operation" ("id" text not null, "operation_key" text not null, "state" text not null, "details" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payment_operation_pkey" primary key ("id"), constraint "payment_operation_operation_key_unique" unique ("operation_key"));`);
    // This operational ledger contains bank/session references; no browser access.
    this.addSql(`alter table "payment_operation" enable row level security;`);
    this.addSql(`do $$ begin if exists(select 1 from pg_roles where rolname='anon') then revoke all on "payment_operation" from anon; end if; if exists(select 1 from pg_roles where rolname='authenticated') then revoke all on "payment_operation" from authenticated; end if; end $$;`);
  }
  override async down(): Promise<void> { this.addSql(`drop table if exists "payment_operation";`); }
}
