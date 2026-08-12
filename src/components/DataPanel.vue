<script setup lang="ts">
import { computed, ref } from 'vue';
import type { DataIssue, DataTable } from '../types';
const props = defineProps<{ table: DataTable; raw: string; issues: DataIssue[] }>();
const emit = defineEmits<{ 'update:raw': [value: string]; parse: []; cell: [row: number, col: number, value: string]; header: [col: number, value: string]; addRow: []; deleteRows: [rows: number[]]; addColumn: []; deleteColumn: [col: number] }>();
const mode = ref<'table' | 'paste'>('table');
const selected = ref(new Set<number>());
const errors = computed(() => props.issues.filter(issue => issue.level === 'error'));
function toggle(index: number, checked: boolean) { const next = new Set(selected.value); checked ? next.add(index) : next.delete(index); selected.value = next; }
function remove() { emit('deleteRows', [...selected.value]); selected.value = new Set(); }
</script>

<template>
  <aside class="data-panel panel-shell">
    <div class="panel-heading"><div><span class="eyebrow">DATA</span><h2>数据</h2></div><div class="segmented"><button :class="{ active: mode === 'table' }" @click="mode='table'">表格</button><button :class="{ active: mode === 'paste' }" @click="mode='paste'">粘贴</button></div></div>
    <div v-if="errors.length" class="quality-strip"><strong>{{ errors.length }} 个数据错误</strong><span>{{ errors[0].message }}</span></div>
    <div v-if="mode === 'paste'" class="paste-view">
      <textarea :value="raw" @input="emit('update:raw', ($event.target as HTMLTextAreaElement).value)" placeholder="从 Excel、WPS 或 Numbers 粘贴数据"></textarea>
      <button class="primary-command full" @click="emit('parse')">识别并更新</button>
    </div>
    <template v-else>
      <div class="table-tools"><button @click="emit('addRow')">＋ 行</button><button @click="emit('addColumn')">＋ 列</button><button class="danger-text" :disabled="!selected.size" @click="remove">删除 {{ selected.size || '' }}</button></div>
      <div class="workspace-table-wrap">
        <table class="workspace-table">
          <thead><tr><th class="select-col"></th><th class="index-col">#</th><th v-for="(header,col) in table.headers" :key="col"><div class="column-head"><input :value="header" @change="emit('header',col,($event.target as HTMLInputElement).value)"><button v-if="table.headers.length>2" title="删除列" @click="emit('deleteColumn',col)">×</button></div></th></tr></thead>
          <tbody><tr v-for="(row,rowIndex) in table.rows" :key="rowIndex" :class="{ selected:selected.has(rowIndex) }"><td class="select-col"><input type="checkbox" :checked="selected.has(rowIndex)" @change="toggle(rowIndex,($event.target as HTMLInputElement).checked)"></td><td class="index-col">{{ rowIndex+1 }}</td><td v-for="(cell,colIndex) in row" :key="colIndex"><input :value="cell" :class="{ invalid: issues.some(i=>i.row===rowIndex&&i.col===colIndex&&i.level==='error') }" @change="emit('cell',rowIndex,colIndex,($event.target as HTMLInputElement).value)"></td></tr></tbody>
        </table>
      </div>
    </template>
  </aside>
</template>
