import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261102165516 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "catalog_media" ("id" text not null, "product_id" text not null, "url" text not null, "original_url" text not null, "sha256" text not null, "width" integer not null, "height" integer not null, "details" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "catalog_media_pkey" primary key ("id"));`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_catalog_media_product_id" ON "catalog_media" ("product_id") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_catalog_media_deleted_at" ON "catalog_media" ("deleted_at") WHERE deleted_at IS NULL;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "catalog_media" cascade;`);
  }
}
