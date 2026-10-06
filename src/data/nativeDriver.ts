import {NativeModules} from 'react-native';
import {DriverError, DriverErrorCode, ExecResult, SqlDriver, SqlValue, Statement} from './driver';

type NativeSqlite = {
  execute(sql: string, params: SqlValue[]): Promise<ExecResult>;
  executeBatch(statements: Statement[]): Promise<ExecResult[]>;
};

type NativeError = {code?: string; message?: string; userInfo?: {index?: number} | null};

const CODES: Record<string, DriverErrorCode> = {
  SQLITE_CONSTRAINT: 'CONSTRAINT',
  SQLITE_EXPECT: 'EXPECT',
};

function toDriverError(error: unknown): DriverError {
  const value = (error ?? {}) as NativeError;
  return new DriverError(
    CODES[value.code ?? ''] ?? 'SQL',
    value.message ?? 'SQLite error',
    value.userInfo?.index ?? -1,
  );
}

export function createNativeDriver(): SqlDriver {
  const native = NativeModules.RavaShopSqlite as NativeSqlite | undefined;
  if (!native) {
    throw new DriverError('SQL', 'Modul SQLite Android tidak terpasang.');
  }
  return {
    async execute(sql, params = []) {
      try {
        return await native.execute(sql, params);
      } catch (error) {
        throw toDriverError(error);
      }
    },
    async executeBatch(statements) {
      try {
        return await native.executeBatch(statements.map(s => ({...s, params: s.params ?? []})));
      } catch (error) {
        throw toDriverError(error);
      }
    },
  };
}
