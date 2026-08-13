<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { DataTable } from '../types';
import type { ChartSettings } from '../state/project';
import { buildChartConfig, palettes } from '../charts/config';
declare const Chart: new (context:CanvasRenderingContext2D,config:unknown)=>ChartInstance;
type ChartInstance={destroy():void;resize():void;chartArea?:{left:number;right:number;top:number;bottom:number};legend?:{left:number;right:number;top:number;bottom:number};getElementsAtEventForMode?:(event:Event,mode:string,options:unknown,useFinalPosition:boolean)=>Array<{datasetIndex:number}>};
type CanvasTarget='chart'|'series'|'axis';
type ContextPayload={x:number;y:number;datasetIndex:number|null};
const props=defineProps<{table:DataTable;settings:ChartSettings;zoom:number;errorMessage:string}>();
const emit=defineEmits<{select:[target:CanvasTarget];context:[payload:ContextPayload]}>();
const canvas=ref<HTMLCanvasElement>();let instance:ChartInstance|null=null;let timer:number|undefined;
function render(){window.clearTimeout(timer);timer=window.setTimeout(async()=>{await nextTick();instance?.destroy();instance=null;if(!canvas.value||props.errorMessage)return;const ctx=canvas.value.getContext('2d');if(ctx)instance=new Chart(ctx,buildChartConfig(props.table,props.settings));},100);}
watch(()=>[props.table,props.settings,props.errorMessage],render,{deep:true});
function handleContext(event:MouseEvent){event.preventDefault();const elements=instance?.getElementsAtEventForMode?.(event,'nearest',{intersect:true},true)??[];emit('context',{x:Math.min(event.clientX,window.innerWidth-240),y:Math.min(event.clientY,window.innerHeight-300),datasetIndex:elements[0]?.datasetIndex??null});}
function handleClick(event:MouseEvent){if(!instance||!canvas.value)return;const rect=canvas.value.getBoundingClientRect(),scaleX=canvas.value.width/rect.width,scaleY=canvas.value.height/rect.height,x=(event.clientX-rect.left)*scaleX,y=(event.clientY-rect.top)*scaleY,area=instance.chartArea;if(!area){emit('select','chart');return;}const elements=instance.getElementsAtEventForMode?.(event,'nearest',{intersect:true},true)??[];if(elements.length){emit('select','series');return;}if(x<area.left||x>area.right||y>area.bottom){emit('select','axis');return;}emit('select',y<area.top?'chart':'chart');}
onMounted(render);onBeforeUnmount(()=>{window.clearTimeout(timer);instance?.destroy();});
function getPngDataUrl(){return canvas.value?.toDataURL('image/png',1)??null;}
function download(){if(!canvas.value)return;const link=document.createElement('a');link.download=`table-chart-${Date.now()}.png`;link.href=canvas.value.toDataURL('image/png',1);link.click();}
defineExpose({download,getPngDataUrl});
</script>
<template><main class="canvas-area"><div class="canvas-toolbar"><span>画布</span><span>{{ zoom }}%</span></div><div class="canvas-stage"><div class="chart-sheet" :style="{transform:`scale(${zoom/100})`,background:settings.background||palettes[settings.theme].background,color:palettes[settings.theme].text}"><div v-if="errorMessage" class="canvas-error"><strong>无法生成预览</strong><span>{{errorMessage}}</span></div><canvas v-show="!errorMessage" ref="canvas" aria-label="可交互图表" @click="handleClick" @contextmenu="handleContext"></canvas><div v-if="settings.source&&!errorMessage" class="chart-source">数据来源：{{settings.source}}</div></div></div></main></template>
