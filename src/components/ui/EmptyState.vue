<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  icon: { type: String, default: 'search' },
  title: { type: String, required: true },
  text: { type: String, default: '' },
})
</script>

<template>
  <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
    <span
      class="ftw-float flex size-16 items-center justify-center rounded-3xl bg-base-content/5 opacity-70">
      <AppIcon :name="icon" :size="28" />
    </span>
    <p class="mt-5 text-base font-bold">{{ title }}</p>
    <p v-if="text" class="mt-1.5 max-w-sm text-sm opacity-55">{{ text }}</p>
    <div class="mt-5">
      <slot />
    </div>
  </div>
</template>
