import type { DataIssue, DataTable } from '../types';
import { parseNumericValue } from './parser';

export function validateTable(table: DataTable): DataIssue[] {
  const issues: DataIssue[] = [];
  table.rows.forEach((row, rowIndex) => {
    if (row.length !== table.headers.length) issues.push({ level: 'error', row: rowIndex, col: -1, message: `第 ${rowIndex + 2} 行列数不一致` });
    for (let col = 1; col < table.headers.length; col++) {
      const result = parseNumericValue(row[col]);
      if (result.kind === 'invalid') issues.push({ level: 'error', row: rowIndex, col, message: `第 ${rowIndex + 2} 行「${table.headers[col]}」不是有效数字：${row[col]}` });
      else if (result.kind === 'empty') issues.push({ level: 'warning', row: rowIndex, col, message: `第 ${rowIndex + 2} 行「${table.headers[col]}」为空` });
    }
  });
  return issues;
}
