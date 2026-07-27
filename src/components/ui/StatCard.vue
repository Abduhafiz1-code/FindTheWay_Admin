<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], default: 0 },
  icon: { type: String, default: 'chart' },
  tone: { type: String, default: 'primary' }, // primary | secondary | accent | success | info | warning
  hint: { type: String, default: '' },
  delay: { type: Number, default: 0 },
})

const TONES = {
  primary: 'bg-primary/12 text-primary',
  secondary: 'bg-secondary/12 text-secondary',
  accent: 'bg-accent/12 text-accent',
  success: 'bg-success/12 text-success',
  info: 'bg-info/12 text-info',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/12 text-error',
}
</script>

<template>
  <div
    class="ftw-slide-in group relative overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 p-5 transition-transform duration-200 hover:-translate-y-0.5"
    :style="{ animationDelay: `${delay}ms` }">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-xs font-bold uppercase tracking-wider opacity-50">{{ label }}</p>
        <p class="mt-2 text-3xl font-black tabular-nums tracking-tight">{{ value }}</p>
        <p v-if="hint" class="mt-1 truncate text-xs opacity-55">{{ hint }}</p>
      </div>
      <span
        class="flex size-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110"
        :class="TONES[tone] ?? TONES.primary">
        <AppIcon :name="icon" :size="21" />
      </span>
    </div>
  </div>
</template>
