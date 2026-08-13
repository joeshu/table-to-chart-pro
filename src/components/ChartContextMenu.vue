<script setup lang="ts">
import type { ChartSettings } from '../state/project';
import type { DataTable } from '../types';

type ContextPayload={x:number;y:number;datasetIndex:number|null};
const props=defineProps<{table:DataTable;settings:ChartSettings;payload:ContextPayload;hasClipboardStyle:boolean}>();
const emit=defineEmits<{close:[];focus:[target:'series'|'axis'|'chart'];change:[value:Partial<ChartSettings>];copyStyle:[];pasteStyle:[]}>();
const seriesIndex=()=>props.payload.datasetIndex===null?null:props.payload.datasetIndex;
const seriesId=()=>{const index=seriesIndex();return index===null?null:props.table.columnIds?.[index+1]??String(index+1);};
function isHidden(){const id=seriesId();return Boolean(id&&props.settings.hiddenColumns?.map(String).includes(id));}
function toggleHidden(){const id=seriesId();if(!id)return;const current=new Set((props.settings.hiddenColumns??[]).map(String));current.has(id)?current.delete(id):current.add(id);if(current.size>=props.table.headers.length-1)return;emit('change',{hiddenColumns:[...current]});emit('close');}
function toggleAxis(){const id=seriesId();if(!id||props.settings.type!=='combo')return;const current=new Set((props.settings.comboRightAxisColumns??[]).map(String));current.has(id)?current.delete(id):current.add(id);emit('change',{comboRightAxisColumns:[...current]});emit('close');}
function addTrend(){const id=seriesId();if(!id)return;emit('change',{seriesTrendlines:{...(props.settings.seriesTrendlines??{}),[id]:'linear'}});emit('close');}
</script>
<template><div class="chart-context-menu" :style="{left:`${payload.x}px`,top:`${payload.y}px`}" @click.stop><button @click="emit('focus','series')">打开系列属性</button><button v-if="seriesIndex()!==null" @click="toggleHidden">{{isHidden()?'显示':'隐藏'}}此系列</button><button v-if="settings.type==='combo'&&seriesIndex()!==null" @click="toggleAxis">切换左右轴</button><button v-if="settings.type==='line'||settings.type==='area'||settings.type==='combo'" @click="addTrend">添加线性趋势线</button><button @click="emit('copyStyle')">复制系列样式</button><button :disabled="!hasClipboardStyle" @click="emit('pasteStyle')">粘贴系列样式</button><button @click="emit('close')">取消</button></div></template>
