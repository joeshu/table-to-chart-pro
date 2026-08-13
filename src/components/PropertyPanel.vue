<script setup lang="ts">
import {computed,ref} from 'vue';
import type {ChartSettings,NumberFormat,ThemeName} from '../state/project';
import type {ChartType} from '../types';
import {palettes} from '../charts/config';
import SeriesEditor from './SeriesEditor.vue';
import AxisStyleEditor from './AxisStyleEditor.vue';
import ChartStyleEditor from './ChartStyleEditor.vue';
import ChartBehaviorEditor from './ChartBehaviorEditor.vue';
import PropertyGroup from './PropertyGroup.vue';
const props=defineProps<{settings:ChartSettings;numericColumns:number;headers:string[]}>();
const emit=defineEmits<{change:[Partial<ChartSettings>]}>();
const tab=ref<'chart'|'series'|'axis'|'appearance'>('chart');
const hasSeriesEditor=computed(()=>['bar','line','area','combo'].includes(props.settings.type));
const chartTypes:{value:ChartType;label:string;icon:string;min?:number}[]=[
{value:'bar',label:'柱状',icon:'▥'},{value:'line',label:'折线',icon:'⌁'},{value:'area',label:'面积',icon:'◒'},{value:'pie',label:'饼图',icon:'◔'},{value:'doughnut',label:'环形',icon:'◉'},{value:'scatter',label:'散点',icon:'⠿',min:2},{value:'bubble',label:'气泡',icon:'◌',min:3},{value:'radar',label:'雷达',icon:'◇'},{value:'combo',label:'组合',icon:'▦',min:2},{value:'waterfall',label:'瀑布',icon:'▟'},{value:'heatmap',label:'热力',icon:'▦',min:2},{value:'funnel',label:'漏斗',icon:'▽'}];
const themes:ThemeName[]=['business','ocean','forest','sunset','dark','rose'];
const themeLabels:Record<ThemeName,string>={business:'商务蓝',ocean:'海洋青',forest:'森林绿',sunset:'日落橙',dark:'深色',rose:'玫瑰红'};
const formats:{value:NumberFormat;label:string}[]=[{value:'number',label:'数字'},{value:'compact',label:'紧凑'},{value:'percent',label:'百分比'},{value:'currency',label:'人民币'}];
function chooseType(type:ChartType){const item=chartTypes.find(value=>value.value===type);if(item?.min&&props.numericColumns<item.min)return;emit('change',{type});}
function optionalNumber(value:string){return value.trim()===''?null:Number(value);}
function updateCustomColor(index:number,color:string){const colors=[...props.settings.customColors];colors[index]=color;emit('change',{customColors:colors});}
function exportBrand(){const data=JSON.stringify({version:1,theme:props.settings.theme,customColors:props.settings.customColors,background:props.settings.background},null,2),link=document.createElement('a');link.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));link.download='chart-brand-theme.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),500);}
function importBrand(){const input=document.createElement('input');input.type='file';input.accept='.json';input.onchange=async()=>{try{const file=input.files?.[0];if(!file)return;const value=JSON.parse(await file.text()),colors=Array.isArray(value.customColors)?value.customColors.filter((color:unknown)=>typeof color==='string'&&/^#[0-9a-f]{6}$/i.test(color)).slice(0,12):[];emit('change',{theme:themes.includes(value.theme)?value.theme:props.settings.theme,customColors:colors,background:typeof value.background==='string'&&/^#[0-9a-f]{6}$/i.test(value.background)?value.background:props.settings.background});}catch{alert('品牌主题文件无效');}};input.click();}
</script>
<template>
<aside class="property-panel">
  <header class="property-header"><div><strong>图表属性</strong><span>{{settings.title||'未命名图表'}}</span></div></header>
  <nav class="property-tabs" aria-label="属性分类">
    <button :class="{active:tab==='chart'}" @click="tab='chart'"><b>▦</b><span>图表</span></button>
    <button :class="{active:tab==='series'}" @click="tab='series'"><b>≡</b><span>系列</span></button>
    <button :class="{active:tab==='axis'}" @click="tab='axis'"><b>⌗</b><span>坐标轴</span></button>
    <button :class="{active:tab==='appearance'}" @click="tab='appearance'"><b>◐</b><span>外观</span></button>
  </nav>
  <div class="property-content">
    <template v-if="tab==='chart'">
      <PropertyGroup title="图表类型" hint="选择最适合数据的图形" :open="true">
        <div class="chart-type-grid"><button v-for="item in chartTypes" :key="item.value" :class="{active:settings.type===item.value,disabled:item.min&&numericColumns<item.min}" :disabled="Boolean(item.min&&numericColumns<item.min)" :title="item.min&&numericColumns<item.min?`至少需要 ${item.min} 个数值列`:item.label" @click="chooseType(item.value)"><span>{{item.icon}}</span><small>{{item.label}}</small></button></div>
      </PropertyGroup>
      <PropertyGroup title="标题与说明" hint="图表名称、说明和来源" :open="true">
        <div class="field-stack"><label>主标题<input :value="settings.title" @input="emit('change',{title:($event.target as HTMLInputElement).value})"></label><label>副标题<input :value="settings.subtitle" placeholder="可选" @input="emit('change',{subtitle:($event.target as HTMLInputElement).value})"></label><label>数据来源<input :value="settings.source" placeholder="可选" @input="emit('change',{source:($event.target as HTMLInputElement).value})"></label></div>
      </PropertyGroup>      <ChartBehaviorEditor :settings="settings" @change="emit('change',$event)"/>
      <PropertyGroup title="显示内容" hint="图例、标签、网格与动画">
        <div class="setting-toggles"><label><span>显示图例</span><input type="checkbox" :checked="settings.showLegend" @change="emit('change',{showLegend:($event.target as HTMLInputElement).checked})"></label><label><span>显示数据标签</span><input type="checkbox" :checked="settings.showDataLabels" @change="emit('change',{showDataLabels:($event.target as HTMLInputElement).checked})"></label><label><span>显示网格线</span><input type="checkbox" :checked="settings.showGrid" @change="emit('change',{showGrid:($event.target as HTMLInputElement).checked})"></label><label><span>启用动画</span><input type="checkbox" :checked="settings.animate" @change="emit('change',{animate:($event.target as HTMLInputElement).checked})"></label></div>
      </PropertyGroup>
    </template>    <template v-else-if="tab==='series'">
      <div v-if="!hasSeriesEditor" class="property-empty"><strong>当前图表无需系列设置</strong><span>饼图等图表按数据项配色，请前往“外观”调整主题和品牌色。</span></div>
      <SeriesEditor v-else :settings="settings" :headers="headers" :combo="settings.type==='combo'" @change="emit('change',$event)"/>
    </template>
    <template v-else-if="tab==='axis'">
      <PropertyGroup title="轴标题与范围" hint="标题、最小值、最大值和步长" :open="true">
        <div class="field-stack"><label>X 轴标题<input :value="settings.xAxisTitle" placeholder="可选" @input="emit('change',{xAxisTitle:($event.target as HTMLInputElement).value})"></label><label>左 Y 轴标题<input :value="settings.yAxisTitle" placeholder="可选" @input="emit('change',{yAxisTitle:($event.target as HTMLInputElement).value})"></label></div>
        <label class="inline-check"><span>左轴从 0 开始</span><input type="checkbox" :checked="settings.yBeginAtZero" @change="emit('change',{yBeginAtZero:($event.target as HTMLInputElement).checked})"></label>
        <div class="range-grid"><label>最小值<input type="number" :value="settings.yMin??''" @input="emit('change',{yMin:optionalNumber(($event.target as HTMLInputElement).value)})"></label><label>最大值<input type="number" :value="settings.yMax??''" @input="emit('change',{yMax:optionalNumber(($event.target as HTMLInputElement).value)})"></label><label>步长<input type="number" min="0" :value="settings.yStep??''" @input="emit('change',{yStep:optionalNumber(($event.target as HTMLInputElement).value)})"></label></div>
      </PropertyGroup>      <PropertyGroup v-if="settings.type==='combo'" title="右侧坐标轴" hint="组合图第二坐标轴范围与格式" :open="true">
        <div class="field-stack"><label>右轴标题<input :value="settings.rightAxisTitle" placeholder="自动使用系列名称" @input="emit('change',{rightAxisTitle:($event.target as HTMLInputElement).value})"></label><label>数值格式<select :value="settings.rightAxisFormat" @change="emit('change',{rightAxisFormat:($event.target as HTMLSelectElement).value as NumberFormat|'auto'})"><option value="auto">自动识别</option><option v-for="item in formats" :key="item.value" :value="item.value">{{item.label}}</option></select></label></div>
        <label class="inline-check"><span>右轴从 0 开始</span><input type="checkbox" :checked="settings.y2BeginAtZero" @change="emit('change',{y2BeginAtZero:($event.target as HTMLInputElement).checked})"></label>
        <div class="range-grid"><label>最小值<input type="number" :value="settings.y2Min??''" @input="emit('change',{y2Min:optionalNumber(($event.target as HTMLInputElement).value)})"></label><label>最大值<input type="number" :value="settings.y2Max??''" @input="emit('change',{y2Max:optionalNumber(($event.target as HTMLInputElement).value)})"></label><label>步长<input type="number" min="0" :value="settings.y2Step??''" @input="emit('change',{y2Step:optionalNumber(($event.target as HTMLInputElement).value)})"></label></div>
      </PropertyGroup>
      <PropertyGroup title="刻度与网格" hint="标签密度、角度和网格线">
        <label>X 轴标签角度 {{settings.xLabelRotation}}°</label><input type="range" min="0" max="90" step="15" :value="settings.xLabelRotation" @input="emit('change',{xLabelRotation:Number(($event.target as HTMLInputElement).value)})"><label>最多显示 {{settings.xMaxTicks}} 个刻度</label><input type="range" min="3" max="30" :value="settings.xMaxTicks" @input="emit('change',{xMaxTicks:Number(($event.target as HTMLInputElement).value)})"><label>网格线 {{settings.gridLineWidth}}px</label><input type="range" min=".5" max="3" step=".5" :value="settings.gridLineWidth" @input="emit('change',{gridLineWidth:Number(($event.target as HTMLInputElement).value)})"><label class="inline-check"><span>显示坐标轴边线</span><input type="checkbox" :checked="settings.showAxisBorder" @change="emit('change',{showAxisBorder:($event.target as HTMLInputElement).checked})"></label>
      </PropertyGroup>
      <AxisStyleEditor :settings="settings" @change="emit('change',$event)"/>
    </template>    <template v-else>
      <PropertyGroup title="主题与背景" hint="整体配色和画布背景" :open="true">
        <div class="theme-grid"><button v-for="theme in themes" :key="theme" :class="{active:settings.theme===theme}" @click="emit('change',{theme})"><i :style="{background:palettes[theme].colors[0]}"></i><span>{{themeLabels[theme]}}</span></button></div>
        <label class="color-setting"><span>画布背景</span><input type="color" :value="settings.background||palettes[settings.theme].background" @input="emit('change',{background:($event.target as HTMLInputElement).value})"><button v-if="settings.background" @click="emit('change',{background:''})">跟随主题</button></label>
      </PropertyGroup>
      <PropertyGroup title="数值格式" hint="单位、前后缀和小数位" :open="true">
        <div class="field-stack"><label>显示格式<select :value="settings.numberFormat" @change="emit('change',{numberFormat:($event.target as HTMLSelectElement).value as NumberFormat})"><option v-for="item in formats" :key="item.value" :value="item.value">{{item.label}}</option></select></label><label>数值前缀<input :value="settings.valuePrefix" placeholder="例如 ¥" @input="emit('change',{valuePrefix:($event.target as HTMLInputElement).value})"></label><label>数值后缀<input :value="settings.valueSuffix" placeholder="例如 万元" @input="emit('change',{valueSuffix:($event.target as HTMLInputElement).value})"></label></div><label>小数位 {{settings.decimals}}</label><input type="range" min="0" max="3" :value="settings.decimals" @input="emit('change',{decimals:Number(($event.target as HTMLInputElement).value)})">
      </PropertyGroup>      <PropertyGroup title="品牌颜色" hint="系列颜色和主题文件">
        <div class="brand-colors"><input v-for="index in 5" :key="index" type="color" :value="settings.customColors[index-1]||palettes[settings.theme].colors[index-1]" @input="updateCustomColor(index-1,($event.target as HTMLInputElement).value)"><button v-if="settings.customColors.length" @click="emit('change',{customColors:[]})">重置</button></div><div class="brand-actions"><button @click="importBrand">导入主题</button><button @click="exportBrand">导出主题</button></div>
      </PropertyGroup>
      <ChartStyleEditor :settings="settings" @change="emit('change',$event)"/>
    </template>
  </div>
</aside>
</template>
