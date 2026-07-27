<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore, AVAILABLE_THEMES } from '../stores/ui'
import { useAuthStore } from '../stores/auth'
import { goToDesktop, goToBiznes, goToApp } from '../config'
import AppIcon from '../components/AppIcon.vue'
import PageHeader from '../components/ui/PageHeader.vue'

const ui = useUiStore()
const auth = useAuthStore()
const router = useRouter()

const fullName = ref('')
const phone = ref('')
const savingProfile = ref(false)
const profileMessage = ref('')
const profileError = ref('')

const newPassword = ref('')
const savingPassword = ref(false)
const passwordMessage = ref('')
const passwordError = ref('')

onMounted(() => {
  fullName.value = auth.displayName
  phone.value = auth.phone
})

async function saveProfile() {
  profileMessage.value = ''
  profileError.value = ''
  savingProfile.value = true
  try {
    await auth.updateProfile({ fullName: fullName.value.trim(), phone: phone.value.trim() })
    profileMessage.value = ui.t('common.saved')
  } catch (e) {
    profileError.value = e?.message ?? ui.t('common.error')
  } finally {
    savingProfile.value = false
  }
}

async function savePassword() {
  passwordMessage.value = ''
  passwordError.value = ''
  if (newPassword.value.length < 6) {
    passwordError.value = ui.t('settings.errPasswordShort')
    return
  }
  savingPassword.value = true
  try {
    await auth.updatePassword(newPassword.value)
    newPassword.value = ''
    passwordMessage.value = ui.t('settings.passwordUpdated')
  } catch (e) {
    passwordError.value = e?.message ?? ui.t('common.error')
  } finally {
    savingPassword.value = false
  }
}

async function logout() {
  try {
    await auth.signOut()
  } catch {
    /* jim o'tamiz */
  }
  router.push({ name: 'login' })
}

const LINKS = [
  { key: 'desktop', labelKey: 'nav.desktop', icon: 'globe', go: goToDesktop },
  { key: 'biznes', labelKey: 'nav.biznes', icon: 'building', go: goToBiznes },
  { key: 'app', labelKey: 'nav.app', icon: 'cap', go: goToApp },
]
</script>

<template>
  <div class="max-w-3xl">
    <PageHeader :title="ui.t('settings.title')" :subtitle="ui.t('settings.subtitle')" />

    <!-- ============ Hisob ============ -->
    <section
      class="ftw-slide-in rounded-2xl border border-base-content/10 bg-base-100 p-5 sm:p-6">
      <h2 class="flex items-center gap-2 text-base font-bold">
        <span class="flex size-8 items-center justify-center rounded-xl bg-primary/12 text-primary">
          <AppIcon name="user" :size="16" />
        </span>
        {{ ui.t('settings.account') }}
      </h2>

      <form class="mt-5 grid gap-4 sm:grid-cols-2" @submit.prevent="saveProfile">
        <label class="block">
          <span class="mb-1.5 block text-sm font-semibold">{{ ui.t('settings.fullName') }}</span>
          <div class="relative">
            <AppIcon
              name="user"
              :size="17"
              class="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 opacity-40" />
            <input
              v-model="fullName"
              type="text"
              class="input input-bordered h-12 w-full rounded-xl pl-11" />
          </div>
        </label>

        <label class="block">
          <span class="mb-1.5 block text-sm font-semibold">{{ ui.t('settings.phone') }}</span>
          <div class="relative">
            <AppIcon
              name="phone"
              :size="17"
              class="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 opacity-40" />
            <input
              v-model="phone"
              type="tel"
              placeholder="+998 90 123 45 67"
              class="input input-bordered h-12 w-full rounded-xl pl-11" />
          </div>
        </label>

        <label class="block sm:col-span-2">
          <span class="mb-1.5 block text-sm font-semibold">{{ ui.t('settings.email') }}</span>
          <div class="relative">
            <AppIcon
              name="mail"
              :size="17"
              class="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 opacity-40" />
            <input
              :value="auth.email"
              type="email"
              disabled
              class="input input-bordered h-12 w-full rounded-xl pl-11 opacity-60" />
          </div>
          <span class="mt-1.5 block text-xs opacity-45">{{ ui.t('settings.emailHint') }}</span>
        </label>

        <div class="flex items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            class="btn btn-primary ftw-press h-11 rounded-xl px-6"
            :disabled="savingProfile">
            <span v-if="savingProfile" class="loading loading-spinner loading-sm" />
            <template v-else>{{ ui.t('common.save') }}</template>
          </button>
          <span v-if="profileMessage" class="flex items-center gap-1.5 text-sm font-semibold text-success">
            <AppIcon name="checkCircle" :size="16" />
            {{ profileMessage }}
          </span>
          <span v-if="profileError" class="text-sm font-semibold text-error">{{ profileError }}</span>
        </div>
      </form>
    </section>

    <!-- ============ Ko'rinish ============ -->
    <section
      class="ftw-slide-in mt-4 rounded-2xl border border-base-content/10 bg-base-100 p-5 sm:p-6"
      style="animation-delay: 80ms">
      <h2 class="flex items-center gap-2 text-base font-bold">
        <span class="flex size-8 items-center justify-center rounded-xl bg-accent/12 text-accent">
          <AppIcon name="palette" :size="16" />
        </span>
        {{ ui.t('settings.appearance') }}
      </h2>

      <div class="mt-5">
        <p class="text-sm font-semibold">{{ ui.t('settings.language') }}</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="l in ui.locales"
            :key="l.code"
            type="button"
            class="rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors"
            :class="
              ui.locale === l.code
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-base-content/10 opacity-70 hover:opacity-100'
            "
            @click="ui.setLocale(l.code)">
            {{ l.label ?? l.code.toUpperCase() }}
          </button>
        </div>
      </div>

      <div class="mt-6">
        <p class="text-sm font-semibold">{{ ui.t('settings.theme') }}</p>
        <div class="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <button
            v-for="t in AVAILABLE_THEMES"
            :key="t.name"
            type="button"
            class="flex items-center gap-3 rounded-xl border p-3 text-left transition-colors"
            :class="
              ui.theme === t.name
                ? 'border-primary bg-primary/8'
                : 'border-base-content/10 hover:bg-base-200/60'
            "
            @click="ui.setTheme(t.name)">
            <span class="flex shrink-0 gap-1">
              <span
                v-for="(color, i) in t.swatch"
                :key="i"
                class="size-4 rounded-full border border-base-content/10"
                :style="{ background: color }" />
            </span>
            <span class="flex-1 truncate text-sm font-bold">{{ ui.t(t.labelKey) }}</span>
            <AppIcon v-if="ui.theme === t.name" name="check" :size="15" :stroke="3" class="text-primary" />
          </button>
        </div>
      </div>
    </section>

    <!-- ============ Xavfsizlik ============ -->
    <section
      class="ftw-slide-in mt-4 rounded-2xl border border-base-content/10 bg-base-100 p-5 sm:p-6"
      style="animation-delay: 140ms">
      <h2 class="flex items-center gap-2 text-base font-bold">
        <span class="flex size-8 items-center justify-center rounded-xl bg-info/12 text-info">
          <AppIcon name="lock" :size="16" />
        </span>
        {{ ui.t('settings.security') }}
      </h2>

      <form class="mt-5 flex flex-wrap items-end gap-3" @submit.prevent="savePassword">
        <label class="min-w-56 flex-1">
          <span class="mb-1.5 block text-sm font-semibold">{{ ui.t('settings.newPassword') }}</span>
          <div class="relative">
            <AppIcon
              name="lock"
              :size="17"
              class="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 opacity-40" />
            <input
              v-model="newPassword"
              type="password"
              autocomplete="new-password"
              :placeholder="ui.t('settings.newPasswordPlaceholder')"
              class="input input-bordered h-12 w-full rounded-xl pl-11" />
          </div>
        </label>
        <button
          type="submit"
          class="btn btn-outline ftw-press h-12 rounded-xl px-5"
          :disabled="savingPassword">
          <span v-if="savingPassword" class="loading loading-spinner loading-sm" />
          <template v-else>{{ ui.t('settings.updatePassword') }}</template>
        </button>
      </form>
      <p v-if="passwordMessage" class="mt-3 flex items-center gap-1.5 text-sm font-semibold text-success">
        <AppIcon name="checkCircle" :size="16" />
        {{ passwordMessage }}
      </p>
      <p v-if="passwordError" class="mt-3 text-sm font-semibold text-error">{{ passwordError }}</p>
    </section>

    <!-- ============ Loyihalar ============ -->
    <section
      class="ftw-slide-in mt-4 rounded-2xl border border-base-content/10 bg-base-100 p-5 sm:p-6"
      style="animation-delay: 200ms">
      <h2 class="flex items-center gap-2 text-base font-bold">
        <span class="flex size-8 items-center justify-center rounded-xl bg-secondary/12 text-secondary">
          <AppIcon name="layers" :size="16" />
        </span>
        {{ ui.t('settings.projects') }}
      </h2>
      <p class="mt-1 text-sm opacity-55">{{ ui.t('settings.projectsText') }}</p>

      <div class="mt-4 grid gap-2 sm:grid-cols-3">
        <button
          v-for="link in LINKS"
          :key="link.key"
          type="button"
          class="flex items-center gap-3 rounded-xl border border-base-content/10 p-3.5 text-left transition-colors hover:bg-base-200/60"
          @click="link.go()">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-base-content/5">
            <AppIcon :name="link.icon" :size="17" />
          </span>
          <span class="flex-1 truncate text-sm font-bold">{{ ui.t(link.labelKey) }}</span>
          <AppIcon name="external" :size="14" class="opacity-40" />
        </button>
      </div>
    </section>

    <!-- ============ Chiqish ============ -->
    <section
      class="ftw-slide-in mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-error/20 bg-error/5 p-5 sm:p-6"
      style="animation-delay: 260ms">
      <div class="min-w-0 flex-1">
        <p class="text-base font-bold">{{ ui.t('settings.logout') }}</p>
        <p class="mt-0.5 text-sm opacity-60">{{ ui.t('settings.logoutText') }}</p>
      </div>
      <button type="button" class="btn btn-error btn-outline ftw-press rounded-xl" @click="logout">
        <AppIcon name="logout" :size="17" />
        {{ ui.t('nav.logout') }}
      </button>
    </section>
  </div>
</template>
