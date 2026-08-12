<script setup lang="ts">
import { computed, ref } from 'vue';
import type { DataIssue, DataTable } from '../types';
const props = defineProps<{ table: DataTable; raw: string; issues: DataIssue[] }>();
const emit = defineEmits<{ 'update:raw': [value: string]; parse: []; import: [encoding:string]; cell: [row: number, col: number, value: string]; header: [col: number, value: string]; addRow: []; deleteRows: [rows: number[]]; addColumn: []; deleteColumn: [col: number] }>();
const mode = ref<'table' | 'paste'>('table'); const selected = ref(new Set<number>()); const scrollTop = ref(0);const encoding=ref('utf-8');
const rowHeight = 45, buffer = 8;
const errors = computed(() => props.issues.filter(issue => issue.level === 'error'));
const start = computed(() => Math.max(0, Math.floor(scrollTop.value / rowHeight) - buffer));
const end = computed(() => Math.min(props.table.rows.length, start.value + Math.ceil(520 / rowHeight) + buffer * 2));
const visibleRows = computed(() => props.table.rows.slice(start.value, end.value).map((row, offset) => ({ row, index: start.value + offset })));
function toggle(index: number, checked: boolean) { const next = new Set(selected.value); checked ? next.add(index) : next.delete(index); selected.value = next; }
function remove() { emit('deleteRows', [...selected.value]); selected.value = new Set(); }
function parseAndShowTable() { emit('parse'); mode.value = 'table'; }
function onScroll(event: Event) { scrollTop.value = (event.target as HTMLElement).scrollTop; }
</script>
<template>
  <aside class="data-panel panel-shell">
    <div class="panel-heading"><div><span class="eyebrow">DATA</span><h2>数据</h2></div><div class="segmented"><button :class="{ active: mode === 'table' }" @click="mode='table'">表格</button><button :class="{ active: mode === 'paste' }" @click="mode='paste'">粘贴</button></div></div>
    <div v-if="errors.length" class="quality-strip"><strong>{{ errors.length }} 个数据错误</strong><span>{{ errors[0].message }}</span></div>
    <div v-if="mode === 'paste'" class="paste-view"><textarea :value="raw" @input="emit('update:raw', ($event.target as HTMLTextAreaElement).value)" placeholder="从 Excel、WPS 或 Numbers 粘贴数据"></textarea><button class="primary-command full" @click="parseAndShowTable">识别并更新</button></div>
    <template v-else>
      <div class="table-tools"><button class="import-button" @click="emit('import',encoding)">导入文件</button><select v-model="encoding" class="encoding-select" aria-label="导入文本编码"><option value="utf-8">UTF-8</option><option value="gbk">GBK</option><option value="gb18030">GB18030</option></select><button @click="emit('addRow')">＋ 行</button><button @click="emit('addColumn')">＋ 列</button><button class="danger-text" :disabled="!selected.size" @click="remove">删除 {{ selected.size || '' }}</button><span class="virtual-hint">{{table.rows.length > 120 ? `虚拟渲染 ${table.rows.length} 行` : ''}}</span></div>
      <div class="workspace-table-wrap" @scroll="onScroll"><table class="workspace-table"><thead><tr><th class="select-col"></th><th class="index-col">#</th><th v-for="(header,col) in table.headers" :key="col"><div class="column-head"><input :value="header" @change="emit('header',col,($event.target as HTMLInputElement).value)"><button v-if="table.headers.length>2" title="删除列" @click="emit('deleteColumn',col)">×</button></div></th></tr></thead><tbody><tr v-if="table.rows.length>120" class="virtual-spacer"><td :colspan="table.headers.length+2" :style="{height:`${start*rowHeight}px`}"></td></tr><tr v-for="item in visibleRows" :key="item.index" :class="{ selected:selected.has(item.index) }"><td class="select-col"><input type="checkbox" :checked="selected.has(item.index)" @change="toggle(item.index,($event.target as HTMLInputElement).checked)"></td><td class="index-col">{{ item.index+1 }}</td><td v-for="(cell,colIndex) in item.row" :key="colIndex"><input :value="cell" :class="{ invalid: issues.some(i=>i.row===item.index&&i.col===colIndex&&i.level==='error') }" @change="emit('cell',item.index,colIndex,($event.target as HTMLInputElement).value)"></td></tr><tr v-if="table.rows.length>120" class="virtual-spacer"><td :colspan="table.headers.length+2" :style="{height:`${(table.rows.length-end)*rowHeight}px`}"></td></tr></tbody></table></div>
    </template>
  </aside>
</template>
