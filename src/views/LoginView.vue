<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '../stores/ui'
import { useAuthStore } from '../stores/auth'
import AppIcon from '../components/AppIcon.vue'

const ui = useUiStore()
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (!email.value.trim() || !password.value) {
    error.value = ui.t('auth.errRequired')
    return
  }

  loading.value = true
  try {
    await auth.signIn(email.value.trim(), password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.replace(redirect)
  } catch (e) {
    if (e?.code === 'NOT_ADMIN') error.value = ui.t('auth.errNotAdmin')
    else if (/invalid/i.test(e?.message ?? '')) error.value = ui.t('auth.errInvalid')
    else error.value = e?.message ?? ui.t('common.error')
    password.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="ftw-rise">
    <span
      class="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/12 px-3 py-1.5 text-xs font-bold text-primary">
      <AppIcon name="shield" :size="14" />
      {{ ui.t('brand.panel') }}
    </span>

    <h1 class="text-3xl font-black tracking-tight">{{ ui.t('auth.title') }}</h1>
    <p class="mt-2 text-sm leading-relaxed opacity-60">{{ ui.t('auth.subtitle') }}</p>

    <form class="mt-8 space-y-4" @submit.prevent="submit">
      <label class="block">
        <span class="mb-1.5 block text-sm font-semibold">{{ ui.t('auth.email') }}</span>
        <div class="relative">
          <AppIcon
            name="mail"
            :size="17"
            class="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 opacity-40" />
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            :placeholder="ui.t('auth.emailPlaceholder')"
            class="input input-bordered h-12 w-full rounded-xl pl-11" />
        </div>
      </label>

      <label class="block">
        <span class="mb-1.5 block text-sm font-semibold">{{ ui.t('auth.password') }}</span>
        <div class="relative">
          <AppIcon
            name="lock"
            :size="17"
            class="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 opacity-40" />
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            :placeholder="ui.t('auth.passwordPlaceholder')"
            class="input input-bordered h-12 w-full rounded-xl pl-11 pr-11" />
          <button
            type="button"
            class="absolute right-3 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg opacity-45 transition-opacity hover:opacity-80"
            tabindex="-1"
            @click="showPassword = !showPassword">
            <AppIcon :name="showPassword ? 'eyeOff' : 'eye'" :size="17" />
          </button>
        </div>
      </label>

      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1">
        <div
          v-if="error"
          class="flex items-start gap-2.5 rounded-xl border border-error/25 bg-error/10 px-3.5 py-3 text-sm text-error">
          <AppIcon name="alert" :size="16" class="mt-0.5 shrink-0" />
          <span class="leading-relaxed">{{ error }}</span>
        </div>
      </Transition>

      <button
        type="submit"
        class="btn btn-primary ftw-press h-12 w-full rounded-xl text-base"
        :disabled="loading">
        <span v-if="loading" class="loading loading-spinner loading-sm" />
        <template v-else>
          {{ ui.t('auth.submit') }}
          <AppIcon name="arrowRight" :size="18" />
        </template>
      </button>
    </form>

    <p class="mt-6 flex items-start gap-2 text-xs leading-relaxed opacity-45">
      <AppIcon name="shield" :size="14" class="mt-0.5 shrink-0" />
      {{ ui.t('auth.hint') }}
    </p>
  </div>
</template>
