<template>
  <listbox as="div" v-model="selected">
    <listbox-label class="block">Font</listbox-label>
    <div class="mt-2 relative">
      <listbox-button
        class="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      >
        <span class="flex items-center">
          <span class="block w-16" :style="{ fontFamily: selected }">FUCK</span>
          <span class="block truncate">
            {{ selected }}
          </span>
        </span>
        <span class="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <selector-icon class="h-5 w-5 text-gray-400" aria-hidden="true" />
        </span>
      </listbox-button>

      <transition
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <listbox-options
          class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-56 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
        >
          <listbox-option
            as="template"
            v-for="font in fonts"
            :key="font"
            :value="font"
            v-slot="{ active, selected }"
          >
            <li
              :class="[
                active ? 'text-white bg-indigo-600' : 'text-gray-900',
                'cursor-default select-none relative py-2 pl-3 pr-9',
              ]"
            >
              <div class="flex items-center">
                <span class="block w-16" :style="{ fontFamily: font }">FUCK</span>
                <span class="block truncate" :class="selected ? 'font-semibold' : 'font-normal'">
                  {{ font }}
                </span>
              </div>

              <span
                v-if="selected"
                class="absolute inset-y-0 right-0 flex items-center pr-4"
                :class="active ? 'text-white' : 'text-indigo-600'"
              >
                <check-icon class="h-5 w-5" aria-hidden="true" />
              </span>
            </li>
          </listbox-option>
        </listbox-options>
      </transition>
    </div>
  </listbox>
</template>

<script setup lang="ts">
import { ref, toRefs, watch } from 'vue';
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue';
import { CheckIcon, SelectorIcon } from '@heroicons/vue/solid';

import { FontFamily, fonts } from '@/fonts';

const props = defineProps<{ modelValue: FontFamily }>();
const { modelValue } = toRefs(props);
const emit = defineEmits<{
  (event: 'update:modelValue', value: FontFamily): void;
}>();

const selected = ref(props.modelValue);
watch(modelValue, newFont => {
  selected.value = newFont;
});
watch(selected, newFont => {
  emit('update:modelValue', newFont);
});
</script>
