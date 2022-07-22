<template>
  <div class="w-full my-4 lg:flex lg:flex-row lg:justify-center lg:space-x-12">
    <div>
      <div class="max-w-sm px-4 sm:px-0 mx-auto my-6">
        <div class="relative z-0 grid grid-cols-2 shadow-sm rounded-md">
          <button
            type="button"
            class="relative flex items-center justify-center px-4 py-2 rounded-l-md border border-violet-300 bg-violet-500 text-sm font-medium text-white hover:bg-violet-600 hover:shadow-inner focus:z-10 focus:outline-none hover:cursor-pointer"
            @click="fileInputRef && fileInputRef.click()"
          >
            <camera-icon class="hidden xs:block -ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Import Shot
          </button>
          <input ref="fileInputRef" id="file" type="file" class="sr-only" @change="onFileChange" />
          <button
            type="button"
            class="-ml-px relative flex items-center justify-center px-3 py-2 rounded-r-md border border-red-300 bg-red-500 text-sm font-medium text-white hover:bg-red-600 hover:shadow-inner focus:z-10 focus:outline-none"
            @click="exportFuckified()"
          >
            <save-icon class="hidden xs:block -ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Export Fuckified!
          </button>
        </div>
        <div class="text-center text-xs text-gray-700 mt-2">
          <span class="whitespace-nowrap">All processing is local,</span>{{ ' ' }}
          <span class="whitespace-nowrap">your screenshot never leaves your device.</span>
        </div>
      </div>

      <div
        class="relative mx-auto my-6 overflow-hidden"
        :style="{
          height: `${screenshotDisplayHeight}px`,
          width: `${screenshotDisplayWidth}px`,
          backgroundImage: `url(${screenshotURL})`,
          backgroundSize: '100%',
        }"
      >
        <canvas
          ref="fuckCanvasRef"
          class="box-content absolute h-full w-full cursor-move"
          :style="{
            height: `${screenshotDisplayHeight + canvasPaddingY * verticalStretch * 2}px`,
            width: `${screenshotDisplayWidth + canvasPaddingX * 2}px`,
            // We round here because otherwise a gap might appear between the
            // content and the borders.
            top: `${Math.round(
              fuckTop - screenshotDisplayHeight - canvasPaddingY * verticalStretch
            )}px`,
            left: `${Math.round(fuckLeft - screenshotDisplayWidth - canvasPaddingX)}px`,
            borderWidth: `${screenshotDisplayHeight}px ${screenshotDisplayWidth}px`,
            borderColor: coverColor,
          }"
        >
        </canvas>
      </div>

      <div class="max-w-sm mx-auto my-6 px-6 sm:px-0 text-center">
        <div
          class="inline-block p-2 font-medium leading-none rounded-md"
          :style="{
            color: withLchLightness(coverColor, 50),
            backgroundColor: withLchLightness(coverColor, 90),
          }"
        >
          Drag the <span class="px-px" :style="{ fontFamily }">FUCK</span> to move it around!
        </div>
      </div>
    </div>

    <div class="max-w-sm lg:w-96 mx-auto my-6 px-6 sm:px-0 space-y-4">
      <color-selector v-model="coverColor" />

      <font-selector v-model="fontFamily" />

      <div>
        <div class="mb-1">Font size</div>
        <vue-slider
          v-model="fontSizeMultiplier"
          v-bind="sliderCommonProps"
          :min="minFontSizeMultiplier"
          :max="maxFontSizeMultiplier"
          :interval="0.01"
        />
      </div>

      <div>
        <div class="mb-1">Extra stroke width</div>
        <vue-slider
          v-model="extraStrokeWidth"
          v-bind="sliderCommonProps"
          :min="minExtraStrokeWidth"
          :max="maxExtraStrokeWidth"
          :interval="0.01"
        />
      </div>

      <div>
        <div class="mb-1">Vertical stretch</div>
        <vue-slider
          v-model="verticalStretch"
          v-bind="sliderCommonProps"
          :min="minVerticalStretch"
          :max="maxVerticalStretch"
          :interval="0.01"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useWindowSize } from '@vueuse/core';
import FontFaceObserver from 'fontfaceobserver';

import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/default.css';
import { CameraIcon, SaveIcon } from '@heroicons/vue/solid';

import ColorSelector from '@/components/ColorSelector.vue';
import FontSelector from '@/components/FontSelector.vue';
import { renderAndDownload } from '@/render';
import { FontFamily, fonts } from '@/fonts';
import {
  clamp,
  getLocalStorage,
  getLocalStorageNumber,
  isHexColor,
  setLocalStorage,
  withLchLightness,
} from '@/utils';

import placeholderURL from '@/assets/placeholder.svg';

const { height: windowHeight, width: windowWidth } = useWindowSize();

const screenshotURL = ref(placeholderURL);
const screenshotHeight = ref(0);
const screenshotWidth = ref(0);
const screenshotScale = computed(() =>
  Math.min(
    Math.max(windowHeight.value - 64, 1) / screenshotHeight.value,
    // Horizontal layout for >= 1024px has 384px for control panel and 48px for margin.
    Math.max(windowWidth.value - 64 - (windowWidth.value >= 1024 ? 432 : 0), 1) /
      screenshotWidth.value,
    2 / 3 / window.devicePixelRatio
  )
);
const screenshotDisplayHeight = computed(() =>
  Math.round(screenshotHeight.value * screenshotScale.value)
);
const screenshotDisplayWidth = computed(() =>
  Math.round(screenshotWidth.value * screenshotScale.value)
);

const fuckCanvasRef = ref<HTMLCanvasElement>();

function measureFuckSize({
  fontFamily,
  fontSize,
  verticalStretch,
}: {
  fontFamily: string;
  fontSize: number;
  verticalStretch: number;
}): {
  height: number;
  width: number;
} {
  if (!fuckCanvasRef.value || fontSize === 0) {
    return { height: 0, width: 0 };
  }
  const canvas = fuckCanvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('cannot get canvas 2d context');
  }
  ctx.font = `${fontSize}px "${fontFamily}"`;
  const metrics = ctx.measureText('FUCK');
  return {
    height: (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) * verticalStretch,
    width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
  };
}

const fuckDimensions = computed(() =>
  measureFuckSize({
    fontFamily: fontFamily.value,
    fontSize: maxFontSize.value * fontSizeMultiplier.value,
    verticalStretch: verticalStretch.value,
  })
);
const fuckHeight = computed(() => fuckDimensions.value.height);
const fuckWidth = computed(() => fuckDimensions.value.width);
const fuckTop = ref(0);
const fuckLeft = ref(0);

// Rescale coordinates on scale change.
watch(screenshotScale, (newScale, oldScale) => {
  if (oldScale === 0) {
    return;
  }
  fuckTop.value = Math.round((fuckTop.value * newScale) / oldScale);
  fuckLeft.value = Math.round((fuckLeft.value * newScale) / oldScale);
});

const COVER_COLOR_LOCALSTORAGE_KEY = 'coverColor';
const FONT_FAMILY_LOCALSTORAGE_KEY = 'fontFamily';
const FONT_SIZE_MULTIPLIER_LOCALSTORAGE_KEY = 'fontSizeMultiplier';
const EXTRA_STROKE_WIDTH_LOCALSTORAGE_KEY = 'extraStrokeWidth';
const VERTICAL_STRETCH_LOCALSTORAGE_KEY = 'verticalStretch';

const defaultCoverColor = '#ef4444';
const defaultFontSizeMultiplier = 0.85;
const minFontSizeMultiplier = 0.25;
const maxFontSizeMultiplier = 1;
const defaultExtraStrokeWidth = 0;
const minExtraStrokeWidth = 0;
const maxExtraStrokeWidth = 1;
const defaultVerticalStretch = 1;
const minVerticalStretch = 1;
const maxVerticalStretch = 2;

const coverColor = ref(
  (() => {
    const stored = getLocalStorage(COVER_COLOR_LOCALSTORAGE_KEY);
    return stored && isHexColor(stored) ? stored : defaultCoverColor;
  })()
);
const fontFamily = ref(
  ((): FontFamily => {
    const defaultFont = fonts[0];
    const stored = getLocalStorage(FONT_FAMILY_LOCALSTORAGE_KEY);
    return stored && (fonts as readonly string[]).includes(stored)
      ? (stored as FontFamily)
      : defaultFont;
  })()
);
const maxFontSize = computed(() => {
  const { width } = measureFuckSize({
    fontFamily: fontFamily.value,
    fontSize: 100,
    verticalStretch: 1,
  });
  return (screenshotDisplayWidth.value / width) * 100;
});
const fontSizeMultiplier = ref(
  getLocalStorageNumber(
    FONT_SIZE_MULTIPLIER_LOCALSTORAGE_KEY,
    defaultFontSizeMultiplier,
    minFontSizeMultiplier,
    maxFontSizeMultiplier
  )
);
const fontSize = computed(() => maxFontSize.value * fontSizeMultiplier.value);
const extraStrokeWidth = ref(
  getLocalStorageNumber(
    EXTRA_STROKE_WIDTH_LOCALSTORAGE_KEY,
    defaultExtraStrokeWidth,
    minExtraStrokeWidth,
    maxExtraStrokeWidth
  )
);
const verticalStretch = ref(
  getLocalStorageNumber(
    VERTICAL_STRETCH_LOCALSTORAGE_KEY,
    defaultVerticalStretch,
    minVerticalStretch,
    maxVerticalStretch
  )
);

watch(coverColor, () => {
  setLocalStorage(COVER_COLOR_LOCALSTORAGE_KEY, coverColor.value);
});
watch(fontFamily, () => {
  setLocalStorage(FONT_FAMILY_LOCALSTORAGE_KEY, fontFamily.value);
});
watch(fontSizeMultiplier, () => {
  setLocalStorage(FONT_SIZE_MULTIPLIER_LOCALSTORAGE_KEY, fontSizeMultiplier.value);
});
watch(extraStrokeWidth, () => {
  setLocalStorage(EXTRA_STROKE_WIDTH_LOCALSTORAGE_KEY, extraStrokeWidth.value);
});
watch(verticalStretch, () => {
  setLocalStorage(VERTICAL_STRETCH_LOCALSTORAGE_KEY, verticalStretch.value);
});

const sliderCommonProps = computed(() => ({
  tooltip: 'none' as const,
  dotSize: 20,
  processStyle: {
    backgroundColor: coverColor.value,
  },
}));

const canvasScale = ref(window.devicePixelRatio);
// Drawing the text at (0, 0) can lead to some amount of cutoff with certain
// fonts, so we expand the canvas a bit to avoid this.
const canvasPaddingX = 20;
const canvasPaddingY = 50;
async function drawFuckMask() {
  if (!fuckCanvasRef.value) {
    return;
  }
  await new FontFaceObserver(fontFamily.value).load();
  const canvas = fuckCanvasRef.value;
  canvas.width = (screenshotDisplayWidth.value + canvasPaddingX * 2) * canvasScale.value;
  canvas.height =
    ((screenshotDisplayHeight.value + canvasPaddingY * verticalStretch.value * 2) *
      canvasScale.value) /
    verticalStretch.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('cannot get canvas 2d context');
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = coverColor.value;
  ctx.strokeStyle = coverColor.value;
  ctx.lineWidth = fontSize.value * canvasScale.value * extraStrokeWidth.value * 0.08;
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.font = `${fontSize.value * canvasScale.value}px "${fontFamily.value}"`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('FUCK', canvasPaddingX * canvasScale.value, canvasPaddingY * canvasScale.value);
  ctx.strokeText('FUCK', canvasPaddingX * canvasScale.value, canvasPaddingY * canvasScale.value);
}

watch(
  [
    screenshotDisplayHeight,
    screenshotDisplayWidth,
    coverColor,
    fontFamily,
    fontSize,
    extraStrokeWidth,
    verticalStretch,
  ],
  () => {
    drawFuckMask();
  }
);

function initFuckPosition() {
  fuckTop.value = (screenshotDisplayHeight.value - fuckHeight.value) / 2;
  fuckLeft.value = (screenshotDisplayWidth.value - fuckWidth.value) / 2;
}

function calculateScreenshotDimensions() {
  const img = new Image();
  img.onload = () => {
    screenshotHeight.value = img.height;
    screenshotWidth.value = img.width;
    nextTick(() => initFuckPosition());
  };
  img.src = screenshotURL.value;
}

watch(screenshotURL, () => calculateScreenshotDimensions(), { immediate: true });

const fileInputRef = ref<HTMLInputElement>();
const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement)?.files?.[0];
  if (!file) {
    return;
  }
  screenshotURL.value = URL.createObjectURL(file);
};

function makeFuckCanvasDraggable() {
  const canvas = fuckCanvasRef.value;
  if (!canvas) {
    console.error('fuckCanvasRef has not been initialized');
    return;
  }

  let x = 0;
  let y = 0;

  canvas.onmousedown = onstart;
  canvas.ontouchstart = onstart;

  function onstart(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    const point = e instanceof MouseEvent ? e : e.touches[0];
    x = point.clientX;
    y = point.clientY;
    document.addEventListener('mousemove', onmove);
    document.addEventListener('touchmove', onmove);
    document.addEventListener('mouseup', onend);
    document.addEventListener('touchend', onend);
  }

  function onmove(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    const point = e instanceof MouseEvent ? e : e.touches[0];
    fuckLeft.value = clamp(
      fuckLeft.value + point.clientX - x,
      -0.9 * fuckWidth.value,
      screenshotDisplayWidth.value - 0.1 * fuckWidth.value
    );
    fuckTop.value = clamp(
      fuckTop.value + point.clientY - y,
      -0.8 * fuckHeight.value,
      screenshotDisplayHeight.value - 0.2 * fuckHeight.value
    );
    x = point.clientX;
    y = point.clientY;
  }

  function onend() {
    document.removeEventListener('mousemove', onmove);
    document.removeEventListener('touchmove', onmove);
    document.removeEventListener('mouseup', onend);
    document.removeEventListener('touchend', onend);
  }
}

onMounted(() => {
  makeFuckCanvasDraggable();
});

const exportFuckified = () =>
  renderAndDownload({
    imageURL: screenshotURL.value,
    height: screenshotHeight.value,
    width: screenshotWidth.value,
    color: coverColor.value,
    fontFamily: fontFamily.value,
    fontSize: (maxFontSize.value * fontSizeMultiplier.value) / screenshotScale.value,
    extraStrokeWidth: extraStrokeWidth.value,
    top: fuckTop.value / screenshotScale.value,
    left: fuckLeft.value / screenshotScale.value,
    verticalStretch: verticalStretch.value,
  });
</script>
