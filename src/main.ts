import { createApp } from 'vue';
import './index.css';
import App from './App.vue';

import FontFaceObserver from 'fontfaceobserver';
import { fonts } from '@/fonts';

(async () => {
  for (const font of fonts) {
    await new FontFaceObserver(font).load();
  }
  createApp(App).mount('#app');
})();
