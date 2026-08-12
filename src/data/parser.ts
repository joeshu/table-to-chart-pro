import type { DataTable, NumericResult } from '../types';

export function detectDelimiter(raw: string): string {
  const sample = raw.split(/\r?\n/).slice(0, 5).join('\n');
  return ['\t', ',', ';'].map(delimiter => {
    let quoted = false, score = 0;
    for (let i = 0; i < sample.length; i++) {
      if (sample[i] === '"') quoted = !quoted;
      else if (!quoted && sample[i] === delimiter) score++;
    }
    return { delimiter, score };
  }).sort((a, b) => b.score - a.score)[0].delimiter;
}

export function parseDelimited(raw: string, delimiter = detectDelimiter(raw)): string[][] {
  const rows: string[][] = []; let row: string[] = [], field = '', quoted = false;
  const input = raw.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') {
      if (quoted && input[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted;
    } else if (ch === delimiter && !quoted) { row.push(field.trim()); field = ''; }
    else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && input[i + 1] === '\n') i++;
      row.push(field.trim()); field = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (quoted) throw new Error('存在未闭合的双引号');
  row.push(field.trim()); if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function normalizeHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((header, index) => {
    const base = header || `列${index + 1}`, count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count); return count === 1 ? base : `${base}_${count}`;
  });
}

export function parseNumericValue(input: unknown): NumericResult {
  const original = String(input ?? '').trim();
  if (!original || /^(n\/a|na|null|--|—)$/i.test(original)) return { value: null, kind: 'empty' };
  let text = original.replace(/[￥¥$€£\s]/g, '');
  const percent = text.endsWith('%'); if (percent) text = text.slice(0, -1);
  let negative = false;
  if (/^\(.+\)$/.test(text)) { negative = true; text = text.slice(1, -1); }
  text = text.replace(/,/g, '');
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(text)) return { value: null, kind: 'invalid' };
  let value = Number(text); if (!Number.isFinite(value)) return { value: null, kind: 'invalid' };
  if (negative) value = -Math.abs(value); if (percent) value /= 100;
  return { value, kind: percent ? 'percent' : 'number' };
}

export function parseTable(raw: string): DataTable {
  const matrix = parseDelimited(raw);
  if (matrix.length < 2) throw new Error('数据至少需要表头和一行数据');
  const headers = normalizeHeaders(matrix[0]);
  const rows = matrix.slice(1).map(row => [...row.slice(0, headers.length), ...Array(Math.max(0, headers.length - row.length)).fill('')]);
  return { headers, rows };
}
