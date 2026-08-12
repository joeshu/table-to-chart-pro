<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue';
import AppToolbar from './components/AppToolbar.vue';
import DataPanel from './components/DataPanel.vue';
import ChartCanvas from './components/ChartCanvas.vue';
import PropertyPanel from './components/PropertyPanel.vue';
import StatusBar from './components/StatusBar.vue';
import { useProjectState, type AppTheme, type ChartSettings } from './state/project';

const state=useProjectState(); const chart=ref<InstanceType<typeof ChartCanvas>>();
const errorCount=computed(()=>state.issues.value.filter(i=>i.level==='error').length);
function applyTheme(value:AppTheme){state.setTheme(value);}
watchEffect(()=>{document.documentElement.dataset.theme=state.appTheme.value;});
function changeSettings(value:Partial<ChartSettings>){Object.assign(state.settings,value);state.saved.value=false;}
function keydown(event:KeyboardEvent){const mod=event.ctrlKey||event.metaKey;if(!mod)return;if(event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?state.redo():state.undo();}else if(event.key.toLowerCase()==='y'){event.preventDefault();state.redo();}}
onMounted(()=>window.addEventListener('keydown',keydown));onUnmounted(()=>window.removeEventListener('keydown',keydown));
</script>
<template><div class="app-frame"><AppToolbar :can-undo="Boolean(state.undoStack.value.length)" :can-redo="Boolean(state.redoStack.value.length)" :saved="state.saved.value" :theme="state.appTheme.value" @undo="state.undo" @redo="state.redo" @reset="state.reset" @export="chart?.download()" @theme="applyTheme"/><div class="workspace-grid"><DataPanel :table="state.table.value" :raw="state.rawInput.value" :issues="state.issues.value" @update:raw="state.rawInput.value=$event" @parse="state.parseRaw" @cell="state.updateCell" @header="state.renameColumn" @add-row="state.addRow" @delete-rows="state.deleteRows" @add-column="state.addColumn" @delete-column="state.deleteColumn"/><ChartCanvas ref="chart" :table="state.table.value" :settings="state.settings" :zoom="state.zoom.value" :has-errors="state.hasErrors.value"/><PropertyPanel :settings="state.settings" :numeric-columns="state.table.value.headers.length-1" @change="changeSettings"/></div><StatusBar :rows="state.table.value.rows.length" :cols="state.table.value.headers.length" :errors="errorCount" :saved="state.saved.value" :zoom="state.zoom.value" @zoom="state.zoom.value=$event"/></div></template>
