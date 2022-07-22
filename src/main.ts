import { createApp } from 'vue';
import './index.css';
import App from './App.vue';

import FontFaceObserver from 'fontfaceobserver';
import { fonts } from '@/fonts';

console.log(
  '%cSource code: https://github.com/fanaticscripter/Fuckify',
  'color: #f97316; font-size: 20px'
);

(async () => {
  for (const font of fonts) {
    await new FontFaceObserver(font).load();
  }
  createApp(App).mount('#app');
})();
