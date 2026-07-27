<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useUiStore } from '../stores/ui'
import { useAdminStore, STATUS_META, ROLE_META, APPLICATION_STATUSES } from '../stores/admin'
import { formatDate, formatDateTime } from '../utils/format'
import AppIcon from '../components/AppIcon.vue'
import PageHeader from '../components/ui/PageHeader.vue'
import StatCard from '../components/ui/StatCard.vue'

const ui = useUiStore()
const admin = useAdminStore()

const s = computed(() => admin.stats)

// Ustunli grafik uchun eng baland qiymat
const trendMax = computed(() => Math.max(1, ...admin.applicationsTrend.map((d) => d.count)))
const categoryMax = computed(() => Math.max(1, ...admin.categoryBreakdown.map((c) => c.count)))
const districtTop = computed(() => admin.districtBreakdown.slice(0, 6))
const districtMax = computed(() => Math.max(1, ...districtTop.value.map((d) => d.count)))

// Tailwind dinamik sinf nomlarini ko'rmaydi — shuning uchun qo'lda ro'yxat
const TONES = {
  primary: 'bg-primary/12 text-primary',
  secondary: 'bg-secondary/12 text-secondary',
  accent: 'bg-accent/12 text-accent',
  success: 'bg-success/12 text-success',
  info: 'bg-info/12 text-info',
}

const DAY_LABELS = {
  uz: ['Yak', 'Du', 'Se', 'Cho', 'Pay', 'Ju', 'Sha'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
}
function dayLabel(date) {
  return (DAY_LABELS[ui.locale] ?? DAY_LABELS.uz)[date.getDay()]
}
</script>

<template>
  <div>
    <PageHeader :title="ui.t('dashboard.title')" :subtitle="ui.t('dashboard.subtitle')" />

    <!-- ============ Raqamlar ============ -->
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        :label="ui.t('dashboard.centers')"
        :value="s.centers"
        icon="building"
        tone="primary"
        :hint="`${s.verified} ${ui.t('dashboard.verified').toLowerCase()}`"
        :delay="0" />
      <StatCard
        :label="ui.t('dashboard.pending')"
        :value="s.pending"
        icon="hourglass"
        tone="warning"
        :hint="ui.t('dashboard.pendingTitle')"
        :delay="60" />
      <StatCard
        :label="ui.t('dashboard.users')"
        :value="s.users"
        icon="users"
        tone="accent"
        :hint="`${s.byRole.owner} ${ui.t('roles.owner').toLowerCase()} · ${s.byRole.student} ${ui.t('roles.student').toLowerCase()}`"
        :delay="120" />
      <StatCard
        :label="ui.t('dashboard.applications')"
        :value="s.applications"
        icon="inbox"
        tone="success"
        :hint="`${s.byStatus.new} ${ui.t('status.new').toLowerCase()}`"
        :delay="180" />
    </div>

    <!-- ============ Grafiklar ============ -->
    <div class="mt-6 grid gap-4 lg:grid-cols-5">
      <!-- 7 kunlik arizalar -->
      <section
        class="ftw-slide-in rounded-2xl border border-base-content/10 bg-base-100 p-5 lg:col-span-3"
        style="animation-delay: 220ms">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-bold">{{ ui.t('dashboard.trend') }}</h2>
            <p class="text-xs opacity-55">{{ ui.t('dashboard.trendSubtitle') }}</p>
          </div>
          <span class="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <AppIcon name="trending" :size="18" />
          </span>
        </div>

        <div class="mt-6 flex h-40 items-end gap-2">
          <div
            v-for="(day, index) in admin.applicationsTrend"
            :key="index"
            class="group flex h-full flex-1 flex-col items-center justify-end gap-2">
            <span class="text-[11px] font-bold tabular-nums opacity-0 transition-opacity group-hover:opacity-70">
              {{ day.count }}
            </span>
            <div class="relative w-full flex-1">
              <div
                class="absolute inset-x-0 bottom-0 rounded-t-lg bg-gradient-to-t from-primary/40 to-primary transition-all duration-500 ease-out"
                :style="{ height: `${Math.max(4, (day.count / trendMax) * 100)}%` }" />
            </div>
            <span class="text-[10px] font-semibold opacity-45">{{ dayLabel(day.date) }}</span>
          </div>
        </div>
      </section>

      <!-- Arizalar holati -->
      <section
        class="ftw-slide-in rounded-2xl border border-base-content/10 bg-base-100 p-5 lg:col-span-2"
        style="animation-delay: 280ms">
        <h2 class="text-base font-bold">{{ ui.t('dashboard.byStatus') }}</h2>
        <ul class="mt-4 space-y-3">
          <li v-for="status in APPLICATION_STATUSES" :key="status">
            <div class="mb-1.5 flex items-center justify-between text-sm">
              <span class="flex items-center gap-2 font-medium">
                <span class="size-2 rounded-full" :class="STATUS_META[status].dot" />
                {{ ui.t(STATUS_META[status].labelKey) }}
              </span>
              <span class="font-bold tabular-nums">{{ s.byStatus[status] }}</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-base-content/8">
              <div
                class="h-full rounded-full transition-all duration-700 ease-out"
                :class="STATUS_META[status].dot"
                :style="{
                  width: `${s.applications ? (s.byStatus[status] / s.applications) * 100 : 0}%`,
                }" />
            </div>
          </li>
        </ul>
      </section>
    </div>

    <!-- ============ Yo'nalish va tuman ============ -->
    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <section
        class="ftw-slide-in rounded-2xl border border-base-content/10 bg-base-100 p-5"
        style="animation-delay: 320ms">
        <h2 class="text-base font-bold">{{ ui.t('dashboard.byCategory') }}</h2>
        <p class="text-xs opacity-55">{{ ui.t('dashboard.byCategorySubtitle') }}</p>
        <ul class="mt-4 space-y-2.5">
          <li
            v-for="cat in admin.categoryBreakdown"
            :key="cat.key"
            class="flex items-center gap-3 text-sm">
            <span
              class="flex size-8 shrink-0 items-center justify-center rounded-xl"
              :class="TONES[cat.tone] ?? TONES.primary">
              <AppIcon :name="cat.icon" :size="16" />
            </span>
            <span class="w-32 shrink-0 truncate font-medium">
              {{ ui.t(`categories.${cat.key}`) }}
            </span>
            <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-base-content/8">
              <div
                class="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                :style="{ width: `${(cat.count / categoryMax) * 100}%` }" />
            </div>
            <span class="w-6 shrink-0 text-right font-bold tabular-nums">{{ cat.count }}</span>
          </li>
        </ul>
      </section>

      <section
        class="ftw-slide-in rounded-2xl border border-base-content/10 bg-base-100 p-5"
        style="animation-delay: 360ms">
        <h2 class="text-base font-bold">{{ ui.t('dashboard.byDistrict') }}</h2>
        <p class="text-xs opacity-55">{{ ui.t('dashboard.byCategorySubtitle') }}</p>
        <ul v-if="districtTop.length" class="mt-4 space-y-2.5">
          <li
            v-for="d in districtTop"
            :key="d.district"
            class="flex items-center gap-3 text-sm">
            <span
              class="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
              <AppIcon name="mapPin" :size="16" />
            </span>
            <span class="w-32 shrink-0 truncate font-medium">{{ d.district }}</span>
            <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-base-content/8">
              <div
                class="h-full rounded-full bg-accent transition-all duration-700 ease-out"
                :style="{ width: `${(d.count / districtMax) * 100}%` }" />
            </div>
            <span class="w-6 shrink-0 text-right font-bold tabular-nums">{{ d.count }}</span>
          </li>
        </ul>
        <p v-else class="mt-6 text-sm opacity-50">{{ ui.t('dashboard.empty') }}</p>
      </section>
    </div>

    <!-- ============ Tasdiqlashni kutayotganlar ============ -->
    <section
      class="ftw-slide-in mt-4 rounded-2xl border border-base-content/10 bg-base-100 p-5"
      style="animation-delay: 400ms">
      <div class="flex items-center justify-between gap-3">
        <h2 class="flex items-center gap-2 text-base font-bold">
          <span class="flex size-8 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <AppIcon name="hourglass" :size="16" />
          </span>
          {{ ui.t('dashboard.pendingTitle') }}
        </h2>
        <RouterLink to="/markazlar" class="btn btn-ghost btn-xs rounded-lg">
          {{ ui.t('dashboard.viewAll') }}
        </RouterLink>
      </div>

      <p v-if="!admin.pendingCenters.length" class="mt-5 text-sm opacity-55">
        {{ ui.t('dashboard.pendingEmpty') }}
      </p>

      <ul v-else class="mt-4 grid gap-2 sm:grid-cols-2">
        <li v-for="center in admin.pendingCenters.slice(0, 6)" :key="center.id">
          <RouterLink
            :to="`/markaz/${center.id}`"
            class="flex items-center gap-3 rounded-xl border border-base-content/8 p-3 transition-colors hover:bg-base-200/60">
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/12 text-warning">
              <AppIcon name="building" :size="18" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold">{{ center.name }}</p>
              <p class="truncate text-xs opacity-55">
                {{ center.district || ui.t('common.unknown') }} ·
                {{ formatDate(center.created_at, ui.locale) }}
              </p>
            </div>
            <AppIcon name="chevronRight" :size="16" class="shrink-0 opacity-40" />
          </RouterLink>
        </li>
      </ul>
    </section>

    <!-- ============ So'nggi harakatlar ============ -->
    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <section
        class="ftw-slide-in rounded-2xl border border-base-content/10 bg-base-100 p-5"
        style="animation-delay: 440ms">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-bold">{{ ui.t('dashboard.recentApplications') }}</h2>
          <RouterLink to="/arizalar" class="btn btn-ghost btn-xs rounded-lg">
            {{ ui.t('dashboard.viewAll') }}
          </RouterLink>
        </div>
        <p v-if="!admin.recentApplications.length" class="mt-5 text-sm opacity-55">
          {{ ui.t('dashboard.empty') }}
        </p>
        <ul v-else class="mt-3 divide-y divide-base-content/8">
          <li
            v-for="a in admin.recentApplications"
            :key="a.id"
            class="flex items-center gap-3 py-3">
            <span
              class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-base-content/5">
              <AppIcon :name="STATUS_META[a.status]?.icon ?? 'send'" :size="16" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold">{{ a.student_name || '—' }}</p>
              <p class="truncate text-xs opacity-55">{{ admin.centerName(a.center_id) }}</p>
            </div>
            <div class="shrink-0 text-right">
              <span class="badge badge-sm" :class="STATUS_META[a.status]?.badge">
                {{ ui.t(STATUS_META[a.status]?.labelKey ?? 'status.new') }}
              </span>
              <p class="mt-1 text-[11px] opacity-45">{{ formatDate(a.created_at, ui.locale) }}</p>
            </div>
          </li>
        </ul>
      </section>

      <section
        class="ftw-slide-in rounded-2xl border border-base-content/10 bg-base-100 p-5"
        style="animation-delay: 480ms">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-bold">{{ ui.t('dashboard.recentUsers') }}</h2>
          <RouterLink to="/foydalanuvchilar" class="btn btn-ghost btn-xs rounded-lg">
            {{ ui.t('dashboard.viewAll') }}
          </RouterLink>
        </div>
        <p v-if="!admin.recentUsers.length" class="mt-5 text-sm opacity-55">
          {{ ui.t('dashboard.empty') }}
        </p>
        <ul v-else class="mt-3 divide-y divide-base-content/8">
          <li v-for="p in admin.recentUsers" :key="p.id" class="flex items-center gap-3 py-3">
            <span
              class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-xs font-black text-primary">
              {{ (p.full_name || '?').trim().charAt(0).toUpperCase() }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold">
                {{ p.full_name || ui.t('common.unknown') }}
              </p>
              <p class="truncate text-xs opacity-55">
                {{ p.phone || formatDateTime(p.created_at, ui.locale) }}
              </p>
            </div>
            <span class="badge badge-sm shrink-0" :class="ROLE_META[p.role]?.badge ?? 'badge-ghost'">
              {{ ui.t(ROLE_META[p.role]?.labelKey ?? 'roles.student') }}
            </span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
