import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('search_keywords')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_uuid_v7()`),
    )
    .addColumn('workspace_id', 'uuid', (col) =>
      col.references('workspaces.id').onDelete('cascade').notNull(),
    )
    .addColumn('query', 'varchar', (col) => col.notNull())
    .addColumn('space_id', 'uuid', (col) =>
      col.references('spaces.id').onDelete('cascade'),
    )
    .addColumn('search_count', 'int8', (col) =>
      col.notNull().defaultTo(1),
    )
    .addColumn('last_searched_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  // 支撑 upsert:同一工作区内同一查询词唯一
  await db.schema
    .createIndex('uq_search_keywords_workspace_query')
    .on('search_keywords')
    .columns(['workspace_id', 'query'])
    .unique()
    .execute();

  // 支撑联想查询:按热度+最近排序检索
  await db.schema
    .createIndex('idx_search_keywords_workspace_count')
    .on('search_keywords')
    .columns(['workspace_id', 'search_count', 'last_searched_at'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('search_keywords').execute();
}
