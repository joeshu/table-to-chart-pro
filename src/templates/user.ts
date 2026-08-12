import type { ChartSettings } from '../state/project';
import type { DataTable } from '../types';
import type { ProjectTemplate } from './library';

const KEY='user-project-templates-v1';
export function loadUserTemplates():ProjectTemplate[]{try{return JSON.parse(localStorage.getItem(KEY)??'[]') as ProjectTemplate[];}catch{return[];}}
export function saveUserTemplate(name:string,data:DataTable,chart:ChartSettings):ProjectTemplate[]{const list=loadUserTemplates(),item:ProjectTemplate={id:`user-${Date.now()}`,name,description:`自定义模板 · ${data.rows.length} 行`,data:JSON.parse(JSON.stringify(data)),chart:JSON.parse(JSON.stringify(chart))};const next=[item,...list].slice(0,30);localStorage.setItem(KEY,JSON.stringify(next));return next;}
export function deleteUserTemplate(id:string):ProjectTemplate[]{const next=loadUserTemplates().filter(item=>item.id!==id);localStorage.setItem(KEY,JSON.stringify(next));return next;}
