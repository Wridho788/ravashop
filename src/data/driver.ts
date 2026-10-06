export type SqlValue = string | number | null;
export type Row = Record<string, SqlValue>;

export type Statement = {
  sql: string;
  params?: SqlValue[];
  /** When set, the whole batch rolls back unless the statement changes exactly this many rows. */
  expectChanges?: number;
};

export type ExecResult = {rows: Row[]; changes: number};

/** Contract shared by the Android native module and the Node test driver. */
export interface SqlDriver {
  execute(sql: string, params?: SqlValue[]): Promise<ExecResult>;
  /** Runs all statements in one transaction; any failure rolls back everything. */
  executeBatch(statements: Statement[]): Promise<ExecResult[]>;
}

export type DriverErrorCode = 'CONSTRAINT' | 'EXPECT' | 'SQL';

export class DriverError extends Error {
  readonly code: DriverErrorCode;
  /** Index of the failing statement within a batch, or -1. */
  readonly index: number;

  constructor(code: DriverErrorCode, message: string, index = -1) {
    super(message);
    this.name = 'DriverError';
    this.code = code;
    this.index = index;
  }
}
