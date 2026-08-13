<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { ChartSettings } from '../state/project';
import type { DataTable } from '../types';

type Column={index:number;id:string;header:string};
const props=defineProps<{table:DataTable;settings:ChartSettings}>();
const emit=defineEmits<{close:[];apply:[value:Partial<ChartSettings>]} >();
const category=ref(String(typeof props.settings.categoryColumn==='number'?props.table.columnIds?.[props.settings.categoryColumn]??props.settings.categoryColumn:props.settings.categoryColumn??props.table.columnIds?.[0]??0));
const start=ref(props.settings.dataStartRow??1);
const end=ref(props.settings.dataEndRow??props.table.rows.length);
const ids= computed(()=>props.table.columnIds??props.table.headers.map((_,index)=>String(index)));
const columns=computed<Column[]>(()=>props.table.headers.map((header,index)=>({index,id:ids.value[index]??String(index),header})));
const seriesColumns=computed(()=>columns.value.filter(item=>item.index>0&&item.id!==category.value));
const selected=ref(new Set(seriesColumns.value.filter(item=>!(props.settings.hiddenColumns??[]).map(String).includes(item.id)).map(item=>item.id)));
const initialOrder=(props.settings.seriesOrder??[]).map(String);
const ordered=ref<Column[]>([...initialOrder.map(id=>seriesColumns.value.find(item=>item.id===id)).filter(Boolean) as Column[],...seriesColumns.value.filter(item=>!initialOrder.includes(item.id))]);
  watch(category,(value,previous)=>{if(value===previous)return;const nextColumns=seriesColumns.value,allowed=new Set(nextColumns.map(item=>item.id));selected.value=new Set([...selected.value].filter(id=>allowed.has(id)));ordered.value=[...ordered.value.filter(item=>allowed.has(item.id)),...nextColumns.filter(item=>!ordered.value.some(current=>current.id===item.id))];});
const categoryLabel=computed(()=>columns.value.find(item=>item.id===category.value)?.header??'分类');
function toggle(id:string){const next=new Set(selected.value);next.has(id)?next.delete(id):next.add(id);if(next.size)selected.value=next;}
function move(index:number,direction:number){const target=index+direction;if(target<0||target>=ordered.value.length)return;const next=[...ordered.value];[next[index],next[target]]=[next[target],next[index]];ordered.value=next;}
function apply(){const hidden=ordered.value.filter(item=>!selected.value.has(item.id)).map(item=>item.id);const order=ordered.value.filter(item=>selected.value.has(item.id)).map(item=>item.id);emit('apply',{categoryColumn:category.value,dataStartRow:Math.max(1,Number(start.value)||1),dataEndRow:Math.min(props.table.rows.length,Math.max(1,Number(end.value)||props.table.rows.length)),seriesOrder:order,hiddenColumns:hidden});}
</script>
<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <section class="data-select-dialog">
      <header><div><span class="eyebrow">SELECT DATA</span><h3>选择数据</h3><p>调整图表映射，不会改动左侧原始表格。</p></div><button @click="emit('close')">×</button></header>
      <div class="data-select-grid">
        <div class="data-select-main">
          <label class="export-label">分类轴</label>
          <select class="field" v-model="category"><option v-for="item in columns" :key="item.id" :value="item.id">{{item.header}}</option></select>
          <div class="data-range"><label>起始行<input type="number" min="1" :max="table.rows.length" v-model.number="start"></label><label>结束行<input type="number" min="1" :max="table.rows.length" v-model.number="end"></label></div>
          <label class="export-label">系列（勾选后参与图表）</label>
          <div class="series-select-list"><label v-for="item in ordered" :key="item.id" class="series-select-row"><input type="checkbox" :checked="selected.has(item.id)" @change="toggle(item.id)"><span class="series-color" :style="{background:settings.seriesColors?.[item.id]||'#8792a8'}"></span><strong>{{item.header}}</strong><small>{{item.id}}</small></label></div>
        </div>
        <div class="data-select-order"><label class="export-label">系列顺序</label><p>上下移动会同步图例和绘图区顺序。</p><div v-for="(item,index) in ordered" :key="item.id" class="order-row"><span>{{index+1}}</span><strong>{{item.header}}</strong><button :disabled="index===0" @click="move(index,-1)">↑</button><button :disabled="index===ordered.length-1" @click="move(index,1)">↓</button></div></div>
      </div>
      <footer><span>当前分类：{{categoryLabel}} · {{Math.max(0,Number(end)-Number(start)+1)}} 行</span><div><button class="secondary-command" @click="emit('close')">取消</button><button class="primary-command" @click="apply">应用选择</button></div></footer>
    </section>
  </div>
</template>
