<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useUiStore } from '../stores/ui'
import { useAdminStore, APPLICATION_STATUSES, STATUS_META } from '../stores/admin'
import { formatDateTime } from '../utils/format'
import AppIcon from '../components/AppIcon.vue'
import BaseDropdown from '../components/BaseDropdown.vue'
import PageHeader from '../components/ui/PageHeader.vue'
import EmptyState from '../components/ui/EmptyState.vue'

const ui = useUiStore()
const admin = useAdminStore()

const query = ref('')
const statusFilter = ref('all')
const expanded = ref(null)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return admin.applications.filter((a) => {
    if (statusFilter.value !== 'all' && a.status !== statusFilter.value) return false
    if (!q) return true
    return [a.student_name, a.student_phone, a.student_email, a.course_name, admin.centerName(a.center_id)]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q))
  })
})

const busy = ref(null)

async function setStatus(application, status) {
  if (application.status === status) return
  busy.value = application.id
  try {
    await admin.setApplicationStatus(application.id, status)
  } catch (e) {
    window.alert(e?.message ?? ui.t('common.error'))
  } finally {
    busy.value = null
  }
}

async function remove(application) {
  if (!window.confirm(ui.t('applications.deleteConfirm'))) return
  busy.value = application.id
  try {
    await admin.deleteApplication(application.id)
  } catch (e) {
    window.alert(e?.message ?? ui.t('common.error'))
  } finally {
    busy.value = null
  }
}

function toggle(id) {
  expanded.value = expanded.value === id ? null : id
}
</script>

<template>
  <div>
    <PageHeader :title="ui.t('applications.title')" :subtitle="ui.t('applications.subtitle')">
      <template #actions>
        <span class="rounded-xl bg-base-content/5 px-3 py-2 text-sm font-bold tabular-nums">
          {{ filtered.length }}
          <span class="opacity-50">/ {{ admin.applications.length }}</span>
        </span>
      </template>
    </PageHeader>

    <div
      class="ftw-slide-in mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-base-content/10 bg-base-100 p-3">
      <div class="relative min-w-56 flex-1">
        <AppIcon
          name="search"
          :size="17"
          class="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 opacity-40" />
        <input
          v-model="query"
          type="search"
          :placeholder="ui.t('applications.searchPlaceholder')"
          class="input input-bordered h-11 w-full rounded-xl pl-11" />
      </div>

      <div class="flex flex-wrap rounded-xl bg-base-200/70 p-1">
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
          :class="statusFilter === 'all' ? 'bg-base-100 text-primary shadow-sm' : 'opacity-60 hover:opacity-100'"
          @click="statusFilter = 'all'">
          {{ ui.t('common.all') }}
        </button>
        <button
          v-for="status in APPLICATION_STATUSES"
          :key="status"
          type="button"
          class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
          :class="statusFilter === status ? 'bg-base-100 text-primary shadow-sm' : 'opacity-60 hover:opacity-100'"
          @click="statusFilter = status">
          <span class="size-1.5 rounded-full" :class="STATUS_META[status].dot" />
          {{ ui.t(STATUS_META[status].labelKey) }}
          <span class="opacity-50 tabular-nums">{{ admin.stats.byStatus[status] }}</span>
        </button>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-base-content/10 bg-base-100">
      <div v-if="admin.loading && !admin.loaded" class="flex justify-center py-20">
        <span class="loading loading-spinner loading-lg opacity-40" />
      </div>

      <EmptyState
        v-else-if="!filtered.length"
        icon="inbox"
        :title="admin.applications.length ? ui.t('common.noResults') : ui.t('applications.empty')"
        :text="admin.applications.length ? ui.t('common.noResultsText') : ui.t('applications.emptyText')" />

      <ul v-else class="divide-y divide-base-content/8">
        <li v-for="a in filtered" :key="a.id" class="transition-colors hover:bg-base-200/40">
          <div class="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center gap-3 text-left"
              @click="toggle(a.id)">
              <span
                class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-base-content/5">
                <AppIcon :name="STATUS_META[a.status]?.icon ?? 'send'" :size="17" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-bold">{{ a.student_name || '—' }}</p>
                <p class="truncate text-xs opacity-55">
                  {{ a.student_phone || a.student_email || '—' }}
                </p>
              </div>
            </button>

            <div class="hidden min-w-0 flex-1 sm:block">
              <RouterLink
                :to="`/markaz/${a.center_id}`"
                class="truncate text-sm font-semibold hover:text-primary">
                {{ admin.centerName(a.center_id) }}
              </RouterLink>
              <p class="truncate text-xs opacity-55">
                {{ a.course_name || ui.t('common.none') }}
              </p>
            </div>

            <p class="hidden w-32 shrink-0 text-xs opacity-50 lg:block">
              {{ formatDateTime(a.created_at, ui.locale) }}
            </p>

            <div class="flex shrink-0 items-center gap-1">
              <BaseDropdown width="w-52">
                <template #trigger>
                  <span class="badge badge-sm gap-1" :class="STATUS_META[a.status]?.badge">
                    {{ ui.t(STATUS_META[a.status]?.labelKey ?? 'status.new') }}
                  </span>
                  <AppIcon name="chevronDown" :size="13" class="opacity-50" />
                </template>

                <p class="px-3 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-wider opacity-45">
                  {{ ui.t('applications.setStatus') }}
                </p>
                <button
                  v-for="status in APPLICATION_STATUSES"
                  :key="status"
                  type="button"
                  class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-base-200"
                  :class="a.status === status ? 'text-primary' : ''"
                  :disabled="busy === a.id"
                  @click="setStatus(a, status)">
                  <span class="size-2 rounded-full" :class="STATUS_META[status].dot" />
                  <span class="flex-1">{{ ui.t(STATUS_META[status].labelKey) }}</span>
                  <AppIcon v-if="a.status === status" name="check" :size="14" :stroke="3" />
                </button>
              </BaseDropdown>

              <button
                type="button"
                class="btn btn-ghost btn-xs rounded-lg px-2 text-error"
                :disabled="busy === a.id"
                :title="ui.t('common.delete')"
                @click="remove(a)">
                <AppIcon name="trash" :size="15" />
              </button>
            </div>
          </div>

          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 -translate-y-1"
            leave-active-class="transition-all duration-150 ease-in"
            leave-to-class="opacity-0">
            <div v-if="expanded === a.id" class="border-t border-base-content/8 bg-base-200/40 px-4 py-4 sm:px-5">
              <div class="grid gap-4 sm:grid-cols-3">
                <div>
                  <p class="text-[11px] font-bold uppercase tracking-wider opacity-45">
                    {{ ui.t('applications.colCenter') }}
                  </p>
                  <RouterLink
                    :to="`/markaz/${a.center_id}`"
                    class="mt-1 block text-sm font-semibold hover:text-primary">
                    {{ admin.centerName(a.center_id) }}
                  </RouterLink>
                </div>
                <div>
                  <p class="text-[11px] font-bold uppercase tracking-wider opacity-45">
                    {{ ui.t('applications.colCourse') }}
                  </p>
                  <p class="mt-1 text-sm font-semibold">
                    {{ a.course_name || ui.t('common.none') }}
                  </p>
                </div>
                <div>
                  <p class="text-[11px] font-bold uppercase tracking-wider opacity-45">
                    {{ ui.t('applications.colDate') }}
                  </p>
                  <p class="mt-1 text-sm font-semibold">
                    {{ formatDateTime(a.created_at, ui.locale) }}
                  </p>
                </div>
              </div>

              <div class="mt-4">
                <p class="text-[11px] font-bold uppercase tracking-wider opacity-45">
                  {{ ui.t('applications.message') }}
                </p>
                <p class="mt-1 whitespace-pre-line text-sm leading-relaxed opacity-75">
                  {{ a.message || ui.t('applications.noMessage') }}
                </p>
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                <a
                  v-if="a.student_phone"
                  :href="`tel:${a.student_phone}`"
                  class="btn btn-ghost btn-sm rounded-xl">
                  <AppIcon name="phone" :size="15" />
                  {{ a.student_phone }}
                </a>
                <a
                  v-if="a.student_email"
                  :href="`mailto:${a.student_email}`"
                  class="btn btn-ghost btn-sm rounded-xl">
                  <AppIcon name="mail" :size="15" />
                  {{ a.student_email }}
                </a>
              </div>
            </div>
          </Transition>
        </li>
      </ul>
    </div>
  </div>
</template>
