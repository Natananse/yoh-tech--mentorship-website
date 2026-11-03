import { getDatabase } from './database.mjs';

export { dataDirectory,uploadDirectory } from './database.mjs';
export type SqlValue=string|number|bigint|Uint8Array|null;
export type RunResult={changes:number|bigint;lastInsertRowid:number|bigint};
export interface DataExecutor {
 get<T=Record<string,unknown>>(sql:string,...parameters:SqlValue[]):Promise<T|undefined>;
 all<T=Record<string,unknown>>(sql:string,...parameters:SqlValue[]):Promise<T[]>;
 run(sql:string,...parameters:SqlValue[]):Promise<RunResult>;
}
export interface Database extends DataExecutor {
 transaction<T>(operation:(transaction:DataExecutor)=>Promise<T>):Promise<T>;
}
export function getDb():Database{return getDatabase() as Database;}
