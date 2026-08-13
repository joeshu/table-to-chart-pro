<script setup lang="ts">
import type {ChartSettings} from '../state/project';
import PropertyGroup from './PropertyGroup.vue';
defineProps<{settings:ChartSettings}>();
const emit=defineEmits<{change:[Partial<ChartSettings>]}>();
const n=(event:Event)=>Number((event.target as HTMLInputElement).value);
</script>
<template>
  <PropertyGroup v-if="settings.type==='bar'||settings.type==='combo'" title="柱形布局" hint="间距、堆叠与圆角" :open="true">
    <div class="setting-toggles"><label v-if="settings.type==='bar'"><span>横向显示</span><input type="checkbox" :checked="settings.horizontal" @change="emit('change',{horizontal:($event.target as HTMLInputElement).checked})"></label><label><span>数据堆叠</span><input type="checkbox" :checked="settings.stacked" @change="emit('change',{stacked:($event.target as HTMLInputElement).checked})"></label><label><span>百分比堆叠</span><input type="checkbox" :checked="settings.percentageStacked" @change="emit('change',{percentageStacked:($event.target as HTMLInputElement).checked,stacked:true})"></label></div>
    <label>柱间距 {{Math.round((1-settings.barCategoryPercentage)*100)}}%</label><input type="range" min="5" max="70" step="5" :value="Math.round((1-settings.barCategoryPercentage)*100)" @input="emit('change',{barCategoryPercentage:1-n($event)/100})">
    <label>柱宽 {{Math.round(settings.barPercentage*100)}}%</label><input type="range" min="40" max="100" step="5" :value="settings.barPercentage*100" @input="emit('change',{barPercentage:n($event)/100})">
    <div class="setting-grid"><label>圆角<input type="number" min="0" max="16" :value="settings.barRadius" @input="emit('change',{barRadius:n($event)})"></label><label>边框<input type="number" min="0" max="4" :value="settings.barBorderWidth" @input="emit('change',{barBorderWidth:n($event)})"></label></div>
  </PropertyGroup>
  <PropertyGroup v-if="['line','area','combo'].includes(settings.type)" title="折线表现" hint="线型、数据点与缺失值" :open="true">
    <div class="setting-toggles"><label><span>平滑曲线</span><input type="checkbox" :checked="settings.smooth" @change="emit('change',{smooth:($event.target as HTMLInputElement).checked})"></label><label><span>面积填充</span><input type="checkbox" :checked="settings.areaFill" @change="emit('change',{areaFill:($event.target as HTMLInputElement).checked})"></label><label><span>连接缺失值</span><input type="checkbox" :checked="settings.connectGaps" @change="emit('change',{connectGaps:($event.target as HTMLInputElement).checked})"></label><label><span>虚线</span><input type="checkbox" :checked="settings.lineDash" @change="emit('change',{lineDash:($event.target as HTMLInputElement).checked})"></label><label><span>阶梯线</span><input type="checkbox" :checked="settings.lineStepped" @change="emit('change',{lineStepped:($event.target as HTMLInputElement).checked})"></label></div>
    <div class="setting-grid"><label>线宽<input type="number" min="1" max="6" :value="settings.lineWidth" @input="emit('change',{lineWidth:n($event)})"></label><label>数据点<input type="number" min="0" max="8" :value="settings.pointRadius" @input="emit('change',{pointRadius:n($event)})"></label></div>
  </PropertyGroup>
  <PropertyGroup v-if="settings.type==='pie'||settings.type==='doughnut'" title="饼图布局" hint="角度、中心孔与小项合并" :open="true">
    <label>起始角度 {{settings.pieRotation}}°</label><input type="range" min="-180" max="180" step="15" :value="settings.pieRotation" @input="emit('change',{pieRotation:n($event)})">
    <template v-if="settings.type==='doughnut'"><label>中心孔 {{settings.pieCutout}}%</label><input type="range" min="30" max="80" step="5" :value="settings.pieCutout" @input="emit('change',{pieCutout:n($event)})"><label>中心文案<input :value="settings.pieCenterText" @input="emit('change',{pieCenterText:($event.target as HTMLInputElement).value})"></label></template>    <label>合并小于 {{settings.pieMergeSmallThreshold}}% 的项目</label><input type="range" min="0" max="15" :value="settings.pieMergeSmallThreshold" @input="emit('change',{pieMergeSmallThreshold:n($event)})">
  </PropertyGroup>
  <PropertyGroup v-if="settings.type==='scatter'" title="散点分析" hint="回归趋势" :open="true"><div class="setting-toggles"><label><span>趋势线与 R²</span><input type="checkbox" :checked="settings.showTrendline" @change="emit('change',{showTrendline:($event.target as HTMLInputElement).checked})"></label></div></PropertyGroup>
</template>
