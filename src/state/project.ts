import { computed, reactive, ref } from 'vue';
import { parseTable } from '../data/parser';
import { validateTable } from '../data/validator';
import type { ChartType, DataTable } from '../types';

export type ThemeName = 'business' | 'ocean' | 'forest' | 'sunset' | 'dark' | 'rose';
export type AppTheme = 'system' | 'light' | 'dark';

export interface ChartSettings {
  type: ChartType;
  theme: ThemeName;
  title: string;
  showLegend: boolean;
  showDataLabels: boolean;
  animate: boolean;
  background: string;
}

const emptyTable = (): DataTable => ({ headers: ['项目', '数值'], rows: [['示例 A', '120'], ['示例 B', '180'], ['示例 C', '150']] });

export function useProjectState() {
  const table = ref<DataTable>(emptyTable());
  const rawInput = ref('项目\t数值\n示例 A\t120\n示例 B\t180\n示例 C\t150');
  const settings = reactive<ChartSettings>({ type: 'bar', theme: 'business', title: '数据可视化', showLegend: true, showDataLabels: false, animate: true, background: '#ffffff' });
  const appTheme = ref<AppTheme>((localStorage.getItem('app-theme') as AppTheme) || 'system');
  const zoom = ref(100);
  const saved = ref(true);
  const undoStack = ref<DataTable[]>([]);
  const redoStack = ref<DataTable[]>([]);
  const issues = computed(() => validateTable(table.value));
  const hasErrors = computed(() => issues.value.some(issue => issue.level === 'error'));

  function snapshot() { return JSON.parse(JSON.stringify(table.value)) as DataTable; }
  function commit(previous = snapshot()) {
    undoStack.value.push(previous);
    if (undoStack.value.length > 50) undoStack.value.shift();
    redoStack.value = [];
    saved.value = false;
  }
  function parseRaw() {
    const previous = snapshot();
    table.value = parseTable(rawInput.value);
    commit(previous);
  }
  function updateCell(row: number, col: number, value: string) {
    if (table.value.rows[row][col] === value) return;
    const previous = snapshot(); table.value.rows[row][col] = value; commit(previous);
  }
  function renameColumn(col: number, value: string) {
    if (!value.trim() || table.value.headers[col] === value.trim()) return;
    const previous = snapshot(); table.value.headers[col] = value.trim(); commit(previous);
  }
  function addRow() {
    const previous = snapshot();
    table.value.rows.push([`新项 ${table.value.rows.length + 1}`, ...Array(table.value.headers.length - 1).fill('0')]); commit(previous);
  }
  function deleteRows(indices: number[]) {
    if (!indices.length || indices.length >= table.value.rows.length) return false;
    const previous = snapshot(); const selected = new Set(indices);
    table.value.rows = table.value.rows.filter((_, index) => !selected.has(index)); commit(previous); return true;
  }
  function addColumn() {
    const previous = snapshot(); const name = `新指标 ${table.value.headers.length}`;
    table.value.headers.push(name); table.value.rows.forEach(row => row.push('0')); commit(previous);
  }
  function deleteColumn(index: number) {
    if (table.value.headers.length <= 2) return false;
    const previous = snapshot(); table.value.headers.splice(index, 1); table.value.rows.forEach(row => row.splice(index, 1)); commit(previous); return true;
  }
  function undo() {
    const previous = undoStack.value.pop(); if (!previous) return;
    redoStack.value.push(snapshot()); table.value = previous; saved.value = false;
  }
  function redo() {
    const next = redoStack.value.pop(); if (!next) return;
    undoStack.value.push(snapshot()); table.value = next; saved.value = false;
  }
  function reset() {
    const previous = snapshot(); table.value = emptyTable(); rawInput.value = '项目\t数值\n示例 A\t120\n示例 B\t180\n示例 C\t150'; commit(previous);
  }
  function setTheme(theme: AppTheme) { appTheme.value = theme; localStorage.setItem('app-theme', theme); }

  return { table, rawInput, settings, appTheme, zoom, saved, issues, hasErrors, undoStack, redoStack, parseRaw, updateCell, renameColumn, addRow, deleteRows, addColumn, deleteColumn, undo, redo, reset, setTheme };
}
