<script setup lang="ts">
import type { AppTheme } from '../state/project';
defineProps<{ canUndo: boolean; canRedo: boolean; saved: boolean; theme: AppTheme }>();
const emit = defineEmits<{ undo: []; redo: []; reset: []; export: []; theme: [value: AppTheme] }>();
</script>

<template>
  <header class="app-toolbar">
    <div class="brand"><span class="brand-mark"><i></i><i></i><i></i></span><div><strong>表格转图表</strong><small>PRO</small></div></div>
    <nav class="toolbar-actions" aria-label="项目操作">
      <button class="icon-button" title="新建" @click="emit('reset')">＋</button>
      <span class="toolbar-divider"></span>
      <button class="icon-button" title="撤销 Ctrl/Cmd+Z" :disabled="!canUndo" @click="emit('undo')">↶</button>
      <button class="icon-button" title="重做 Ctrl/Cmd+Shift+Z" :disabled="!canRedo" @click="emit('redo')">↷</button>
    </nav>
    <div class="toolbar-spacer"></div>
    <span class="save-state" :class="{ saved }"><i></i>{{ saved ? '已保存' : '未保存' }}</span>
    <select class="theme-select" :value="theme" aria-label="应用主题" @change="emit('theme', ($event.target as HTMLSelectElement).value as AppTheme)">
      <option value="system">跟随系统</option><option value="light">亮色</option><option value="dark">深色</option>
    </select>
    <button class="primary-command" @click="emit('export')">导出 PNG</button>
  </header>
</template>
