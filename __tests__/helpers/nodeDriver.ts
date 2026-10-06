import {DriverError, ExecResult, Row, SqlDriver, SqlValue, Statement} from '../../src/data/driver';

type NodeStatement = {
  all(...params: SqlValue[]): Row[];
  run(...params: SqlValue[]): {changes: number | bigint};
};
type NodeDatabase = {
  exec(sql: string): void;
  prepare(sql: string): NodeStatement;
  close(): void;
};
type NodeSqlite = {DatabaseSync: new (path: string) => NodeDatabase};

// `node:sqlite` is prefix-only, which Jest's resolver does not know; load it directly.
const sqlite = (process as unknown as {getBuiltinModule(id: string): unknown}).getBuiltinModule(
  'node:sqlite',
) as NodeSqlite;

const SQLITE_CONSTRAINT = 19;

/**
 * Real SQLite driver for integration tests, mirroring the semantics of the Android
 * RavaShopSqlite module (one transaction per batch, `expectChanges` guards).
 */
export function createNodeDriver(path = ':memory:') {
  const db = new sqlite.DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  let failNextBatchAt: number | null = null;

  const run = (sql: string, params: SqlValue[] = []): ExecResult => {
    const keyword = sql.trimStart().toUpperCase();
    if (keyword.startsWith('PRAGMA') && keyword.includes('=')) {
      db.exec(sql);
      return {rows: [], changes: 0};
    }
    const statement = db.prepare(sql);
    if (keyword.startsWith('SELECT') || keyword.startsWith('PRAGMA') || keyword.startsWith('WITH')) {
      return {rows: statement.all(...params).map(row => ({...row})), changes: 0};
    }
    return {rows: [], changes: Number(statement.run(...params).changes)};
  };

  const toDriverError = (error: unknown, index: number) => {
    if (error instanceof DriverError) {
      return error;
    }
    const code = (error as {errcode?: number}).errcode ?? 0;
    const message = error instanceof Error ? error.message : String(error);
    return new DriverError(code % 256 === SQLITE_CONSTRAINT ? 'CONSTRAINT' : 'SQL', message, index);
  };

  const driver: SqlDriver & {
    raw: NodeDatabase;
    close(): void;
    /** Test hook: throw a storage error just before statement `index` of the next batch. */
    failNextBatch(index: number): void;
  } = {
    raw: db,
    close: () => db.close(),
    failNextBatch(index: number) {
      failNextBatchAt = index;
    },
    async execute(sql, params = []) {
      try {
        return run(sql, params);
      } catch (error) {
        throw toDriverError(error, -1);
      }
    },
    async executeBatch(statements: Statement[]) {
      const failAt = failNextBatchAt;
      failNextBatchAt = null;
      let index = -1;
      db.exec('BEGIN');
      try {
        const results = statements.map((statement, i) => {
          index = i;
          if (failAt === i) {
            throw new DriverError('SQL', 'disk I/O error (simulated)', i);
          }
          const result = run(statement.sql, statement.params ?? []);
          if (statement.expectChanges !== undefined && statement.expectChanges !== result.changes) {
            throw new DriverError(
              'EXPECT',
              `Statement ${i} expected ${statement.expectChanges} change(s) but made ${result.changes}`,
              i,
            );
          }
          return result;
        });
        db.exec('COMMIT');
        return results;
      } catch (error) {
        db.exec('ROLLBACK');
        throw toDriverError(error, index);
      }
    },
  };
  return driver;
}
