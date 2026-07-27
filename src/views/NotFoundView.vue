<script setup>
import { RouterLink } from 'vue-router'
import { useUiStore } from '../stores/ui'
import AppIcon from '../components/AppIcon.vue'

const ui = useUiStore()
</script>

<template>
  <div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
    <span
      class="ftw-float flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
      <AppIcon name="compass" :size="36" />
    </span>
    <p class="ftw-gradient-text mt-6 text-6xl font-black tracking-tight">404</p>
    <h1 class="mt-2 text-xl font-bold">{{ ui.t('notFound.title') }}</h1>
    <p class="mt-2 max-w-sm text-sm opacity-60">{{ ui.t('notFound.text') }}</p>
    <RouterLink to="/" class="btn btn-primary ftw-press mt-6 rounded-xl px-6">
      <AppIcon name="arrowLeft" :size="17" />
      {{ ui.t('notFound.cta') }}
    </RouterLink>
  </div>
</template>
