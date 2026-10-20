import postgres from "postgres";

const url = process.env.TEST_DATABASE_URL ?? "postgresql://tapisode:tapisode@localhost:5432/tapisode_test";

/** Test-only access to the e2e database, for setup the UI cannot do (for example removing a cached row). */
export async function withTestSql<T>(run: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    return await run(sql);
  } finally {
    await sql.end();
  }
}
