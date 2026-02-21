import { a as RolldownLog } from "./logging-CKYae7lu.mjs";

//#region src/get-log-filter.d.ts
type GetLogFilter = (filters: string[]) => (log: RolldownLog) => boolean;
declare const getLogFilter: GetLogFilter;
//#endregion
export { getLogFilter as n, GetLogFilter as t };