<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  value: { type: [Number, String], default: 0 },
  size: { type: Number, default: 14 },
  showValue: { type: Boolean, default: true },
})

const rating = computed(() => Math.max(0, Math.min(5, Number(props.value) || 0)))
// To'liq yulduzlar soni — yarimtalarini yaxlitlaymiz
const full = computed(() => Math.round(rating.value))
const label = computed(() => rating.value.toFixed(1))
</script>

<template>
  <span class="inline-flex items-center gap-1">
    <span class="inline-flex items-center gap-0.5 text-warning">
      <AppIcon
        v-for="i in 5"
        :key="i"
        name="star"
        :size="size"
        :stroke="1.5"
        :filled="i <= full"
        :class="i <= full ? '' : 'opacity-25'" />
    </span>
    <span v-if="showValue" class="text-xs font-bold opacity-70">{{ label }}</span>
  </span>
</template>
