import { createApp, defineComponent, h } from 'vue';
import { parseNumericValue } from './data/parser';
import { validateTable } from './data/validator';
import { pearsonCorrelation, safeRatio } from './data/statistics';

// Vue currently owns the application bootstrap boundary. Legacy UI behavior is
// migrated incrementally so every batch remains shippable.
const mount = document.createElement('div');
mount.id = 'vue-runtime';
mount.hidden = true;
document.body.appendChild(mount);

createApp(defineComponent({
  name: 'RuntimeBridge',
  setup: () => () => h('span', { 'data-runtime': 'vue3-typescript' }),
})).mount(mount);

Object.assign(window, {
  __TABLE_TO_CHART_CORE__: { parseNumericValue, validateTable, pearsonCorrelation, safeRatio },
});
