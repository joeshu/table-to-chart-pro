<script setup lang="ts">
defineProps<{title:string;hint?:string;open?:boolean}>();
</script>
<template>
  <details class="property-group" :open="open">
    <summary><span>{{ title }}</span><small v-if="hint">{{ hint }}</small><i>⌄</i></summary>
    <div class="property-group-body"><slot /></div>
  </details>
</template>
