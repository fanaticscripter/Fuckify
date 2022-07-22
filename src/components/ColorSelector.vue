<template>
  <div>
    <label :for="inputId">Color</label>
    <input :id="inputId" type="color" v-model="selected" class="sr-only" />
    <label
      :for="inputId"
      class="block h-8 w-8 rounded-full border border-gray-300 mt-1 hover:cursor-pointer"
      :style="{ backgroundColor: selected }"
    ></label>
  </div>
</template>

<script setup lang="ts">
import { ref, toRefs, watch } from 'vue';
import { nanoid } from 'nanoid';

const props = defineProps<{ modelValue: string }>();
const { modelValue } = toRefs(props);
const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
}>();

const inputId = `color-${nanoid()}`;
const selected = ref(props.modelValue);
watch(modelValue, newColor => {
  selected.value = newColor;
});
watch(selected, newColor => {
  emit('update:modelValue', newColor);
});
</script>
