<script setup>
import { ref, computed } from 'vue'
import { useUiStore } from '../stores/ui'
import { useAuthStore } from '../stores/auth'
import { useAdminStore, ROLES, ROLE_META } from '../stores/admin'
import { formatDate } from '../utils/format'
import AppIcon from '../components/AppIcon.vue'
import BaseDropdown from '../components/BaseDropdown.vue'
import PageHeader from '../components/ui/PageHeader.vue'
import EmptyState from '../components/ui/EmptyState.vue'

const ui = useUiStore()
const auth = useAuthStore()
const admin = useAdminStore()

const query = ref('')
const roleFilter = ref('all')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return admin.profiles.filter((p) => {
    if (roleFilter.value !== 'all' && p.role !== roleFilter.value) return false
    if (!q) return true
    return [p.full_name, p.phone, p.center_name]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q))
  })
})

const busy = ref(null)

async function changeRole(profile, role) {
  if (profile.role === role) return
  if (!window.confirm(`${profile.full_name || profile.id}\n\n${ui.t('users.roleConfirm')}`)) return
  busy.value = profile.id
  try {
    await admin.setRole(profile.id, role)
    // O'z rolini o'zgartirsa — sessiya profilini ham yangilaymiz
    if (profile.id === auth.user?.id) await auth.fetchProfile()
  } catch (e) {
    window.alert(e?.message ?? ui.t('common.error'))
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <div>
    <PageHeader :title="ui.t('users.title')" :subtitle="ui.t('users.subtitle')">
      <template #actions>
        <span class="rounded-xl bg-base-content/5 px-3 py-2 text-sm font-bold tabular-nums">
          {{ filtered.length }}
          <span class="opacity-50">/ {{ admin.profiles.length }}</span>
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
          :placeholder="ui.t('users.searchPlaceholder')"
          class="input input-bordered h-11 w-full rounded-xl pl-11" />
      </div>

      <div class="flex rounded-xl bg-base-200/70 p-1">
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
          :class="roleFilter === 'all' ? 'bg-base-100 text-primary shadow-sm' : 'opacity-60 hover:opacity-100'"
          @click="roleFilter = 'all'">
          {{ ui.t('common.all') }}
        </button>
        <button
          v-for="role in ROLES"
          :key="role"
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
          :class="roleFilter === role ? 'bg-base-100 text-primary shadow-sm' : 'opacity-60 hover:opacity-100'"
          @click="roleFilter = role">
          {{ ui.t(ROLE_META[role].labelKey) }}
          <span class="ml-1 opacity-50 tabular-nums">{{ admin.stats.byRole[role] }}</span>
        </button>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-base-content/10 bg-base-100">
      <div v-if="admin.loading && !admin.loaded" class="flex justify-center py-20">
        <span class="loading loading-spinner loading-lg opacity-40" />
      </div>

      <EmptyState
        v-else-if="!filtered.length"
        icon="users"
        :title="ui.t('users.empty')"
        :text="ui.t('users.emptyText')" />

      <div v-else class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr class="border-base-content/10 text-xs uppercase tracking-wider opacity-50">
              <th>{{ ui.t('users.colName') }}</th>
              <th>{{ ui.t('users.colRole') }}</th>
              <th class="hidden md:table-cell">{{ ui.t('users.colPhone') }}</th>
              <th class="hidden lg:table-cell">{{ ui.t('users.colCenter') }}</th>
              <th class="hidden xl:table-cell">{{ ui.t('users.colCreated') }}</th>
              <th class="text-right">{{ ui.t('users.colActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in filtered"
              :key="p.id"
              class="border-base-content/8 transition-colors hover:bg-base-200/50">
              <td>
                <div class="flex items-center gap-3">
                  <span
                    class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-sm font-black text-primary">
                    {{ (p.full_name || '?').trim().charAt(0).toUpperCase() }}
                  </span>
                  <div class="min-w-0">
                    <p class="truncate font-bold">
                      {{ p.full_name || ui.t('common.unknown') }}
                      <span
                        v-if="p.id === auth.user?.id"
                        class="ml-1 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-black text-primary">
                        {{ ui.t('users.selfHint') }}
                      </span>
                    </p>
                    <p class="truncate text-xs opacity-45">{{ p.id }}</p>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge badge-sm gap-1" :class="ROLE_META[p.role]?.badge ?? 'badge-ghost'">
                  <AppIcon :name="ROLE_META[p.role]?.icon ?? 'user'" :size="11" :stroke="3" />
                  {{ ui.t(ROLE_META[p.role]?.labelKey ?? 'roles.student') }}
                </span>
              </td>
              <td class="hidden text-sm md:table-cell">{{ p.phone || '—' }}</td>
              <td class="hidden max-w-40 truncate text-sm lg:table-cell">
                {{ p.center_name || '—' }}
              </td>
              <td class="hidden text-sm opacity-60 xl:table-cell">
                {{ formatDate(p.created_at, ui.locale) }}
              </td>
              <td>
                <div class="flex justify-end">
                  <BaseDropdown width="w-52">
                    <template #trigger>
                      <AppIcon name="sliders" :size="15" class="opacity-60" />
                      <span class="hidden text-xs font-bold sm:inline">
                        {{ ui.t('users.changeRole') }}
                      </span>
                      <AppIcon name="chevronDown" :size="13" class="opacity-50" />
                    </template>

                    <button
                      v-for="role in ROLES"
                      :key="role"
                      type="button"
                      class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-base-200"
                      :class="p.role === role ? 'text-primary' : ''"
                      :disabled="busy === p.id"
                      @click="changeRole(p, role)">
                      <AppIcon :name="ROLE_META[role].icon" :size="16" class="opacity-60" />
                      <span class="flex-1">{{ ui.t(ROLE_META[role].labelKey) }}</span>
                      <AppIcon v-if="p.role === role" name="check" :size="14" :stroke="3" />
                    </button>
                  </BaseDropdown>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
