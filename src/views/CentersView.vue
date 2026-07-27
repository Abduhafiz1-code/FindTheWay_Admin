<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useUiStore } from '../stores/ui'
import { useAdminStore, CATEGORIES, DISTRICTS } from '../stores/admin'
import { formatDate } from '../utils/format'
import AppIcon from '../components/AppIcon.vue'
import PageHeader from '../components/ui/PageHeader.vue'
import EmptyState from '../components/ui/EmptyState.vue'

const ui = useUiStore()
const admin = useAdminStore()

const query = ref('')
const status = ref('all') // all | verified | pending
const category = ref('')
const district = ref('')

const FILTERS = [
  { key: 'all', labelKey: 'centers.filterAll' },
  { key: 'verified', labelKey: 'centers.filterVerified' },
  { key: 'pending', labelKey: 'centers.filterPending' },
]

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return admin.centers.filter((c) => {
    if (status.value === 'verified' && !c.is_verified) return false
    if (status.value === 'pending' && c.is_verified) return false
    if (category.value && c.category !== category.value) return false
    if (district.value && c.district !== district.value) return false
    if (!q) return true
    return [c.name, c.district, c.phone, c.address]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q))
  })
})

const busy = ref(null)

async function toggleVerified(center) {
  busy.value = center.id
  try {
    await admin.setVerified(center.id, !center.is_verified)
  } catch (e) {
    window.alert(e?.message ?? ui.t('common.error'))
  } finally {
    busy.value = null
  }
}

async function remove(center) {
  if (!window.confirm(`${center.name}\n\n${ui.t('centers.deleteConfirm')}`)) return
  busy.value = center.id
  try {
    await admin.deleteCenter(center.id)
  } catch (e) {
    window.alert(e?.message ?? ui.t('common.error'))
  } finally {
    busy.value = null
  }
}

function reset() {
  query.value = ''
  status.value = 'all'
  category.value = ''
  district.value = ''
}
</script>

<template>
  <div>
    <PageHeader :title="ui.t('centers.title')" :subtitle="ui.t('centers.subtitle')">
      <template #actions>
        <span class="rounded-xl bg-base-content/5 px-3 py-2 text-sm font-bold tabular-nums">
          {{ filtered.length }}
          <span class="opacity-50">/ {{ admin.centers.length }}</span>
        </span>
      </template>
    </PageHeader>

    <!-- ============ Filtrlar ============ -->
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
          :placeholder="ui.t('centers.searchPlaceholder')"
          class="input input-bordered h-11 w-full rounded-xl pl-11" />
      </div>

      <div class="flex rounded-xl bg-base-200/70 p-1">
        <button
          v-for="f in FILTERS"
          :key="f.key"
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
          :class="status === f.key ? 'bg-base-100 text-primary shadow-sm' : 'opacity-60 hover:opacity-100'"
          @click="status = f.key">
          {{ ui.t(f.labelKey) }}
        </button>
      </div>

      <select v-model="category" class="select select-bordered h-11 min-h-11 rounded-xl text-sm">
        <option value="">{{ ui.t('centers.colCategory') }}</option>
        <option v-for="c in CATEGORIES" :key="c.key" :value="c.key">
          {{ ui.t(`categories.${c.key}`) }}
        </option>
      </select>

      <select v-model="district" class="select select-bordered h-11 min-h-11 rounded-xl text-sm">
        <option value="">{{ ui.t('centers.colDistrict') }}</option>
        <option v-for="d in DISTRICTS" :key="d" :value="d">{{ d }}</option>
      </select>

      <button
        v-if="query || status !== 'all' || category || district"
        type="button"
        class="btn btn-ghost btn-sm h-11 rounded-xl"
        @click="reset">
        <AppIcon name="close" :size="15" />
        {{ ui.t('common.cancel') }}
      </button>
    </div>

    <!-- ============ Jadval ============ -->
    <div class="overflow-hidden rounded-2xl border border-base-content/10 bg-base-100">
      <div v-if="admin.loading && !admin.loaded" class="flex justify-center py-20">
        <span class="loading loading-spinner loading-lg opacity-40" />
      </div>

      <EmptyState
        v-else-if="!filtered.length"
        icon="building"
        :title="admin.centers.length ? ui.t('common.noResults') : ui.t('centers.empty')"
        :text="admin.centers.length ? ui.t('common.noResultsText') : ui.t('centers.emptyText')" />

      <div v-else class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr class="border-base-content/10 text-xs uppercase tracking-wider opacity-50">
              <th>{{ ui.t('centers.colName') }}</th>
              <th class="hidden md:table-cell">{{ ui.t('centers.colCategory') }}</th>
              <th class="hidden lg:table-cell">{{ ui.t('centers.colDistrict') }}</th>
              <th class="hidden xl:table-cell text-center">{{ ui.t('centers.colCourses') }}</th>
              <th class="hidden xl:table-cell text-center">{{ ui.t('centers.colApplications') }}</th>
              <th>{{ ui.t('centers.colStatus') }}</th>
              <th class="text-right" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="center in filtered"
              :key="center.id"
              class="border-base-content/8 transition-colors hover:bg-base-200/50">
              <td>
                <RouterLink :to="`/markaz/${center.id}`" class="flex items-center gap-3">
                  <span
                    class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <AppIcon name="building" :size="18" />
                  </span>
                  <div class="min-w-0">
                    <p class="truncate font-bold">{{ center.name }}</p>
                    <p class="truncate text-xs opacity-50">
                      {{ center.phone || formatDate(center.created_at, ui.locale) }}
                    </p>
                  </div>
                </RouterLink>
              </td>
              <td class="hidden text-sm md:table-cell">
                {{ center.category ? ui.t(`categories.${center.category}`) : ui.t('categories.none') }}
              </td>
              <td class="hidden text-sm lg:table-cell">{{ center.district || '—' }}</td>
              <td class="hidden text-center text-sm font-bold tabular-nums xl:table-cell">
                {{ admin.coursesOf(center.id).length }}
              </td>
              <td class="hidden text-center text-sm font-bold tabular-nums xl:table-cell">
                {{ admin.applicationsOf(center.id).length }}
              </td>
              <td>
                <span
                  class="badge badge-sm gap-1"
                  :class="center.is_verified ? 'badge-success' : 'badge-warning'">
                  <AppIcon :name="center.is_verified ? 'check' : 'hourglass'" :size="11" :stroke="3" />
                  {{ center.is_verified ? ui.t('centers.verified') : ui.t('centers.pending') }}
                </span>
              </td>
              <td>
                <div class="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    class="btn btn-xs rounded-lg"
                    :class="center.is_verified ? 'btn-ghost' : 'btn-primary'"
                    :disabled="busy === center.id"
                    @click="toggleVerified(center)">
                    {{ center.is_verified ? ui.t('centers.unverify') : ui.t('centers.verify') }}
                  </button>
                  <RouterLink
                    :to="`/markaz/${center.id}`"
                    class="btn btn-ghost btn-xs rounded-lg px-2"
                    :title="ui.t('common.open')">
                    <AppIcon name="chevronRight" :size="15" />
                  </RouterLink>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs rounded-lg px-2 text-error"
                    :disabled="busy === center.id"
                    :title="ui.t('common.delete')"
                    @click="remove(center)">
                    <AppIcon name="trash" :size="15" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
