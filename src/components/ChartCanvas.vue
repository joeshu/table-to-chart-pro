<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { DataTable } from '../types';
import type { ChartSettings } from '../state/project';
import { buildChartConfig, palettes } from '../charts/config';
declare const Chart: new (context: CanvasRenderingContext2D, config: unknown) => { destroy():void; resize():void };
const props=defineProps<{table:DataTable;settings:ChartSettings;zoom:number;hasErrors:boolean}>();
const canvas=ref<HTMLCanvasElement>(); let instance:{destroy():void;resize():void}|null=null; let timer:number|undefined;
function render(){ window.clearTimeout(timer); timer=window.setTimeout(async()=>{await nextTick(); if(!canvas.value||props.hasErrors)return; instance?.destroy(); const ctx=canvas.value.getContext('2d'); if(ctx)instance=new Chart(ctx,buildChartConfig(props.table,props.settings));},100); }
watch(()=>[props.table,props.settings.type,props.settings.theme,props.settings.title,props.settings.subtitle,props.settings.xAxisTitle,props.settings.yAxisTitle,props.settings.legendPosition,props.settings.showLegend,props.settings.showDataLabels,props.settings.showGrid,props.settings.animate,props.settings.numberFormat,props.settings.decimals,props.settings.horizontal,props.settings.stacked,props.settings.smooth,props.settings.areaFill],render,{deep:true});
onMounted(render); onBeforeUnmount(()=>instance?.destroy());
function getPngDataUrl(){return canvas.value?.toDataURL('image/png',1)??null;}
function download(){if(!canvas.value)return;const link=document.createElement('a');link.download=`table-chart-${Date.now()}.png`;link.href=canvas.value.toDataURL('image/png',1);link.click();}
defineExpose({download,getPngDataUrl});
</script>
<template><main class="canvas-area"><div class="canvas-toolbar"><span>画布</span><span>{{ zoom }}%</span></div><div class="canvas-stage"><div class="chart-sheet" :style="{transform:`scale(${zoom/100})`,background:palettes[settings.theme].background,color:palettes[settings.theme].text}"><div v-if="hasErrors" class="canvas-error"><strong>无法生成预览</strong><span>请先修复数据面板中的错误</span></div><canvas v-show="!hasErrors" ref="canvas"></canvas><div v-if="settings.source&&!hasErrors" class="chart-source">数据来源：{{settings.source}}</div></div></div></main></template>
