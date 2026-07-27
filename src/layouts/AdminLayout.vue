<script setup>
import { ref, computed, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useUiStore } from '../stores/ui'
import { useAuthStore } from '../stores/auth'
import { useAdminStore } from '../stores/admin'
import { goToDesktop, goToBiznes, goToApp } from '../config'
import AppIcon from '../components/AppIcon.vue'
import LocaleSwitcher from '../components/LocaleSwitcher.vue'
import ThemeSwitcher from '../components/ThemeSwitcher.vue'
import BaseDropdown from '../components/BaseDropdown.vue'

const ui = useUiStore()
const auth = useAuthStore()
const admin = useAdminStore()
const route = useRoute()
const router = useRouter()

const drawer = ref(false)

const NAV = [
  { name: 'dashboard', to: '/', labelKey: 'nav.dashboard', icon: 'chart' },
  { name: 'centers', to: '/markazlar', labelKey: 'nav.centers', icon: 'building' },
  { name: 'users', to: '/foydalanuvchilar', labelKey: 'nav.users', icon: 'users' },
  { name: 'applications', to: '/arizalar', labelKey: 'nav.applications', icon: 'inbox' },
  { name: 'settings', to: '/sozlamalar', labelKey: 'nav.settings', icon: 'settings' },
]

const LINKS = [
  { key: 'desktop', labelKey: 'nav.desktop', icon: 'globe', go: goToDesktop },
  { key: 'biznes', labelKey: 'nav.biznes', icon: 'building', go: goToBiznes },
  { key: 'app', labelKey: 'nav.app', icon: 'cap', go: goToApp },
]

// Yon menyudagi kichik raqamlar
const badges = computed(() => ({
  centers: admin.stats.pending || 0,
  applications: admin.stats.byStatus?.new || 0,
}))

function isActive(item) {
  if (item.to === '/') return route.path === '/'
  if (item.name === 'centers') return route.path.startsWith('/markaz')
  return route.path.startsWith(item.to)
}

watch(
  () => route.fullPath,
  () => {
    drawer.value = false
  },
)

const refreshing = ref(false)
async function refresh() {
  refreshing.value = true
  try {
    await admin.loadAll(true)
  } finally {
    refreshing.value = false
  }
}

async function handleLogout() {
  try {
    await auth.signOut()
  } catch {
    /* jim o'tamiz */
  }
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-dvh bg-base-200/40">
    <!-- ============ Yon menyu (katta ekran) ============ -->
    <aside
      class="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-base-content/10 bg-base-100 lg:flex">
      <div class="flex h-16 items-center gap-2.5 px-5">
        <span
          class="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-content">
          <AppIcon name="compass" :size="19" />
        </span>
        <div class="leading-tight">
          <p class="text-sm font-extrabold tracking-tight">{{ ui.t('brand.name') }}</p>
          <p class="text-[10px] font-bold uppercase tracking-wider text-primary">
            {{ ui.t('brand.panel') }}
          </p>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 py-3">
        <p class="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider opacity-40">
          {{ ui.t('nav.sections') }}
        </p>
        <RouterLink
          v-for="item in NAV"
          :key="item.name"
          :to="item.to"
          class="group relative mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors"
          :class="
            isActive(item)
              ? 'bg-primary/12 text-primary'
              : 'opacity-70 hover:bg-base-content/5 hover:opacity-100'
          ">
          <span
            v-if="isActive(item)"
            class="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary" />
          <AppIcon :name="item.icon" :size="18" />
          <span class="flex-1">{{ ui.t(item.labelKey) }}</span>
          <span
            v-if="badges[item.name]"
            class="rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-black text-primary">
            {{ badges[item.name] }}
          </span>
        </RouterLink>

        <p class="mt-5 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider opacity-40">
          {{ ui.t('nav.links') }}
        </p>
        <button
          v-for="link in LINKS"
          :key="link.key"
          type="button"
          class="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium opacity-65 transition-colors hover:bg-base-content/5 hover:opacity-100"
          @click="link.go()">
          <AppIcon :name="link.icon" :size="17" />
          <span class="flex-1">{{ ui.t(link.labelKey) }}</span>
          <AppIcon name="external" :size="14" class="opacity-50" />
        </button>
      </nav>

      <div class="border-t border-base-content/10 p-3">
        <div class="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <span
            class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-xs font-black text-primary">
            {{ auth.initials }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold">{{ auth.displayName }}</p>
            <p class="truncate text-[11px] opacity-55">{{ auth.email }}</p>
          </div>
        </div>
        <button
          type="button"
          class="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-error transition-colors hover:bg-error/10"
          @click="handleLogout">
          <AppIcon name="logout" :size="17" />
          {{ ui.t('nav.logout') }}
        </button>
      </div>
    </aside>

    <!-- ============ Mobil chekma menyu ============ -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0">
        <div
          v-if="drawer"
          class="fixed inset-0 z-[60] bg-base-300/70 backdrop-blur-sm lg:hidden"
          @click="drawer = false" />
      </Transition>
      <Transition
        enter-active-class="transition-transform duration-250 ease-out"
        enter-from-class="-translate-x-full"
        leave-active-class="transition-transform duration-200 ease-in"
        leave-to-class="-translate-x-full">
        <aside
          v-if="drawer"
          class="fixed inset-y-0 left-0 z-[70] flex w-72 flex-col border-r border-base-content/10 bg-base-100 lg:hidden">
          <div class="flex h-16 items-center justify-between px-4">
            <div class="flex items-center gap-2.5">
              <span
                class="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-content">
                <AppIcon name="compass" :size="19" />
              </span>
              <div class="leading-tight">
                <p class="text-sm font-extrabold tracking-tight">{{ ui.t('brand.name') }}</p>
                <p class="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {{ ui.t('brand.panel') }}
                </p>
              </div>
            </div>
            <button
              class="flex size-9 items-center justify-center rounded-xl hover:bg-base-content/5"
              :aria-label="ui.t('common.close')"
              @click="drawer = false">
              <AppIcon name="close" :size="19" />
            </button>
          </div>

          <nav class="flex-1 overflow-y-auto px-3 py-2">
            <RouterLink
              v-for="item in NAV"
              :key="item.name"
              :to="item.to"
              class="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors"
              :class="isActive(item) ? 'bg-primary/12 text-primary' : 'hover:bg-base-content/5'">
              <AppIcon :name="item.icon" :size="18" />
              <span class="flex-1">{{ ui.t(item.labelKey) }}</span>
              <span
                v-if="badges[item.name]"
                class="rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-black text-primary">
                {{ badges[item.name] }}
              </span>
            </RouterLink>

            <div class="mt-3 border-t border-base-content/10 pt-3">
              <button
                v-for="link in LINKS"
                :key="link.key"
                type="button"
                class="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium opacity-70 transition-colors hover:bg-base-content/5"
                @click="link.go()">
                <AppIcon :name="link.icon" :size="17" />
                <span class="flex-1">{{ ui.t(link.labelKey) }}</span>
                <AppIcon name="external" :size="14" class="opacity-50" />
              </button>
              <button
                type="button"
                class="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-error transition-colors hover:bg-error/10"
                @click="handleLogout">
                <AppIcon name="logout" :size="17" />
                {{ ui.t('nav.logout') }}
              </button>
            </div>
          </nav>
        </aside>
      </Transition>
    </Teleport>

    <!-- ============ Asosiy qism ============ -->
    <div class="lg:pl-64">
      <header
        class="ftw-glass sticky top-0 z-40 border-b border-base-content/10">
        <div class="flex h-16 items-center gap-2 px-4 sm:px-6">
          <button
            class="ftw-press flex size-10 items-center justify-center rounded-xl transition-colors hover:bg-base-content/5 lg:hidden"
            aria-label="menu"
            @click="drawer = true">
            <AppIcon name="menu" :size="20" />
          </button>

          <p class="truncate text-sm font-extrabold tracking-tight sm:text-base">
            {{ ui.t(`nav.${route.name === 'center' ? 'centers' : route.name || 'dashboard'}`) }}
          </p>

          <div class="ml-auto flex items-center gap-1">
            <button
              type="button"
              class="ftw-press flex size-10 items-center justify-center rounded-xl transition-colors hover:bg-base-content/5"
              :title="ui.t('common.refresh')"
              @click="refresh">
              <AppIcon
                name="refresh"
                :size="18"
                :class="refreshing ? 'animate-spin opacity-70' : 'opacity-70'" />
            </button>
            <LocaleSwitcher />
            <ThemeSwitcher />

            <BaseDropdown width="w-60" class="hidden sm:block">
              <template #trigger>
                <span
                  class="flex size-6 items-center justify-center rounded-lg bg-primary/15 text-[11px] font-black text-primary">
                  {{ auth.initials }}
                </span>
                <AppIcon name="chevronDown" :size="14" class="opacity-50" />
              </template>

              <div class="mb-1 border-b border-base-content/10 px-3 pb-2.5 pt-1.5">
                <p class="truncate text-sm font-bold">{{ auth.displayName }}</p>
                <p class="truncate text-xs opacity-55">{{ auth.email }}</p>
              </div>
              <RouterLink
                to="/sozlamalar"
                class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-base-200">
                <AppIcon name="settings" :size="16" class="opacity-60" />
                {{ ui.t('nav.settings') }}
              </RouterLink>
              <button
                type="button"
                class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-error transition-colors hover:bg-error/10"
                @click="handleLogout">
                <AppIcon name="logout" :size="16" />
                {{ ui.t('nav.logout') }}
              </button>
            </BaseDropdown>
          </div>
        </div>
      </header>

      <!-- Ma'lumot yuklashda xatolik bo'lsa — ogohlantirish -->
      <div v-if="admin.lastError" class="px-4 pt-4 sm:px-6">
        <div class="flex items-start gap-3 rounded-2xl border border-error/25 bg-error/10 p-4">
          <AppIcon name="alert" :size="18" class="mt-0.5 shrink-0 text-error" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-error">{{ ui.t('common.error') }}</p>
            <p class="mt-0.5 break-words text-xs opacity-70">{{ admin.lastError }}</p>
          </div>
          <button class="btn btn-ghost btn-xs rounded-lg" @click="refresh">
            {{ ui.t('common.retry') }}
          </button>
        </div>
      </div>

      <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <slot />
      </main>
    </div>
  </div>
</template>
