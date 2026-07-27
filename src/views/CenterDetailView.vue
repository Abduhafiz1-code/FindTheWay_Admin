<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useUiStore } from '../stores/ui'
import { useAdminStore, STATUS_META } from '../stores/admin'
import { formatDate, formatDateTime, formatPrice } from '../utils/format'
import AppIcon from '../components/AppIcon.vue'
import RatingStars from '../components/ui/RatingStars.vue'
import EmptyState from '../components/ui/EmptyState.vue'

const ui = useUiStore()
const admin = useAdminStore()
const route = useRoute()
const router = useRouter()

const center = computed(() => admin.centerById(route.params.id))
const owner = computed(() => (center.value ? admin.profileById(center.value.owner_id) : null))
const courses = computed(() => (center.value ? admin.coursesOf(center.value.id) : []))
const applications = computed(() => (center.value ? admin.applicationsOf(center.value.id) : []))

const busy = ref(false)

async function toggleVerified() {
  if (!center.value) return
  busy.value = true
  try {
    await admin.setVerified(center.value.id, !center.value.is_verified)
  } catch (e) {
    window.alert(e?.message ?? ui.t('common.error'))
  } finally {
    busy.value = false
  }
}

async function remove() {
  if (!center.value) return
  if (!window.confirm(`${center.value.name}\n\n${ui.t('centers.deleteConfirm')}`)) return
  busy.value = true
  try {
    await admin.deleteCenter(center.value.id)
    router.push('/markazlar')
  } catch (e) {
    window.alert(e?.message ?? ui.t('common.error'))
    busy.value = false
  }
}
</script>

<template>
  <div>
    <RouterLink
      to="/markazlar"
      class="mb-4 inline-flex items-center gap-2 text-sm font-semibold opacity-60 transition-opacity hover:opacity-100">
      <AppIcon name="arrowLeft" :size="16" />
      {{ ui.t('common.back') }}
    </RouterLink>

    <div v-if="admin.loading && !admin.loaded" class="flex justify-center py-24">
      <span class="loading loading-spinner loading-lg opacity-40" />
    </div>

    <EmptyState
      v-else-if="!center"
      icon="building"
      :title="ui.t('notFound.title')"
      :text="ui.t('notFound.text')" />

    <template v-else>
      <!-- ============ Sarlavha ============ -->
      <section
        class="ftw-rise relative overflow-hidden rounded-3xl border border-base-content/10 bg-base-100 p-6 sm:p-8">
        <div class="ftw-glow pointer-events-none absolute inset-0 opacity-60" />
        <div class="relative flex flex-wrap items-start gap-5">
          <span
            class="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <AppIcon name="building" :size="30" />
          </span>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl font-black tracking-tight sm:text-3xl">{{ center.name }}</h1>
              <span
                class="badge gap-1"
                :class="center.is_verified ? 'badge-success' : 'badge-warning'">
                <AppIcon :name="center.is_verified ? 'check' : 'hourglass'" :size="12" :stroke="3" />
                {{ center.is_verified ? ui.t('centers.verified') : ui.t('centers.pending') }}
              </span>
            </div>

            <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm opacity-65">
              <span class="flex items-center gap-1.5">
                <AppIcon name="mapPin" :size="15" />
                {{ center.district || ui.t('common.unknown') }}
              </span>
              <span class="flex items-center gap-1.5">
                <AppIcon name="layers" :size="15" />
                {{ center.category ? ui.t(`categories.${center.category}`) : ui.t('categories.none') }}
              </span>
              <span class="flex items-center gap-1.5">
                <AppIcon name="calendar" :size="15" />
                {{ formatDate(center.created_at, ui.locale) }}
              </span>
              <RatingStars v-if="center.rating" :value="center.rating" :size="14" />
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <button
              type="button"
              class="btn ftw-press rounded-xl"
              :class="center.is_verified ? 'btn-ghost' : 'btn-primary'"
              :disabled="busy"
              @click="toggleVerified">
              <AppIcon :name="center.is_verified ? 'xCircle' : 'checkCircle'" :size="17" />
              {{ center.is_verified ? ui.t('centers.unverify') : ui.t('centers.verify') }}
            </button>
            <button
              type="button"
              class="btn btn-ghost rounded-xl px-3 text-error"
              :disabled="busy"
              :title="ui.t('common.delete')"
              @click="remove">
              <AppIcon name="trash" :size="17" />
            </button>
          </div>
        </div>
      </section>

      <div class="mt-4 grid gap-4 lg:grid-cols-3">
        <!-- ============ Chap ustun ============ -->
        <div class="space-y-4 lg:col-span-2">
          <section class="rounded-2xl border border-base-content/10 bg-base-100 p-5">
            <h2 class="text-base font-bold">{{ ui.t('centers.about') }}</h2>
            <p class="mt-2 whitespace-pre-line text-sm leading-relaxed opacity-70">
              {{ center.description || ui.t('common.none') }}
            </p>
          </section>

          <section class="rounded-2xl border border-base-content/10 bg-base-100 p-5">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-base font-bold">{{ ui.t('centers.coursesTitle') }}</h2>
              <span class="text-sm font-bold tabular-nums opacity-50">{{ courses.length }}</span>
            </div>

            <p v-if="!courses.length" class="mt-4 text-sm opacity-55">
              {{ ui.t('centers.coursesEmpty') }}
            </p>
            <ul v-else class="mt-3 grid gap-2 sm:grid-cols-2">
              <li
                v-for="course in courses"
                :key="course.id"
                class="flex items-center gap-3 rounded-xl border border-base-content/8 p-3">
                <span
                  class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
                  <AppIcon name="book" :size="16" />
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-bold">{{ course.name }}</p>
                  <p class="text-xs opacity-55">
                    {{ formatPrice(course.price) }} {{ ui.t('common.sum') }}
                  </p>
                </div>
                <span v-if="!course.is_active" class="badge badge-ghost badge-sm shrink-0">
                  {{ ui.t('centers.inactive') }}
                </span>
              </li>
            </ul>
          </section>

          <section class="overflow-hidden rounded-2xl border border-base-content/10 bg-base-100">
            <div class="flex items-center justify-between gap-3 p-5 pb-3">
              <h2 class="text-base font-bold">{{ ui.t('centers.applicationsTitle') }}</h2>
              <span class="text-sm font-bold tabular-nums opacity-50">
                {{ applications.length }}
              </span>
            </div>

            <p v-if="!applications.length" class="px-5 pb-5 text-sm opacity-55">
              {{ ui.t('centers.applicationsEmpty') }}
            </p>
            <ul v-else class="divide-y divide-base-content/8 border-t border-base-content/8">
              <li
                v-for="a in applications"
                :key="a.id"
                class="flex items-center gap-3 px-5 py-3.5">
                <span
                  class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-base-content/5">
                  <AppIcon :name="STATUS_META[a.status]?.icon ?? 'send'" :size="16" />
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold">{{ a.student_name || '—' }}</p>
                  <p class="truncate text-xs opacity-55">
                    {{ a.course_name || ui.t('common.none') }} · {{ a.student_phone || '—' }}
                  </p>
                </div>
                <div class="shrink-0 text-right">
                  <span class="badge badge-sm" :class="STATUS_META[a.status]?.badge">
                    {{ ui.t(STATUS_META[a.status]?.labelKey ?? 'status.new') }}
                  </span>
                  <p class="mt-1 text-[11px] opacity-45">
                    {{ formatDate(a.created_at, ui.locale) }}
                  </p>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <!-- ============ O'ng ustun ============ -->
        <div class="space-y-4">
          <section class="rounded-2xl border border-base-content/10 bg-base-100 p-5">
            <h2 class="text-base font-bold">{{ ui.t('centers.contact') }}</h2>
            <dl class="mt-3 space-y-3 text-sm">
              <div class="flex items-start gap-3">
                <AppIcon name="phone" :size="16" class="mt-0.5 shrink-0 opacity-45" />
                <div class="min-w-0">
                  <dt class="text-xs opacity-50">{{ ui.t('centers.phone') }}</dt>
                  <dd class="truncate font-semibold">{{ center.phone || '—' }}</dd>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <AppIcon name="mapPin" :size="16" class="mt-0.5 shrink-0 opacity-45" />
                <div class="min-w-0">
                  <dt class="text-xs opacity-50">{{ ui.t('centers.address') }}</dt>
                  <dd class="font-semibold">{{ center.address || '—' }}</dd>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <AppIcon name="globe" :size="16" class="mt-0.5 shrink-0 opacity-45" />
                <div class="min-w-0">
                  <dt class="text-xs opacity-50">{{ ui.t('centers.website') }}</dt>
                  <dd class="truncate font-semibold">
                    <a
                      v-if="center.website"
                      :href="center.website"
                      target="_blank"
                      rel="noopener"
                      class="text-primary hover:underline">
                      {{ center.website }}
                    </a>
                    <span v-else>—</span>
                  </dd>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <AppIcon name="wallet" :size="16" class="mt-0.5 shrink-0 opacity-45" />
                <div class="min-w-0">
                  <dt class="text-xs opacity-50">{{ ui.t('centers.priceFrom') }}</dt>
                  <dd class="font-semibold">
                    {{ formatPrice(center.price_from) }} {{ ui.t('common.sum') }}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          <section class="rounded-2xl border border-base-content/10 bg-base-100 p-5">
            <h2 class="text-base font-bold">{{ ui.t('centers.owner') }}</h2>
            <div v-if="owner" class="mt-3 flex items-center gap-3">
              <span
                class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-info/12 text-sm font-black text-info">
                {{ (owner.full_name || '?').trim().charAt(0).toUpperCase() }}
              </span>
              <div class="min-w-0">
                <p class="truncate font-bold">{{ owner.full_name || ui.t('common.unknown') }}</p>
                <p class="truncate text-xs opacity-55">{{ owner.phone || '—' }}</p>
                <p class="mt-0.5 text-[11px] opacity-45">
                  {{ formatDateTime(owner.created_at, ui.locale) }}
                </p>
              </div>
            </div>
            <p v-else class="mt-3 text-sm opacity-55">{{ ui.t('centers.ownerUnknown') }}</p>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
