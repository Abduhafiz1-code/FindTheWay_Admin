<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useAdminStore } from './stores/admin'
import AdminLayout from './layouts/AdminLayout.vue'
import AuthLayout from './layouts/AuthLayout.vue'

const route = useRoute()
const auth = useAuthStore()
const admin = useAdminStore()

const isMain = computed(() => route.meta?.layout !== 'auth')

// Admin kirgach — butun platforma ma'lumotini bir marta yuklaymiz.
watch(
  () => auth.isAuthenticated,
  (ok) => {
    if (ok) admin.loadAll()
    else admin.reset()
  },
  { immediate: true },
)
</script>

<template>
  <component :is="isMain ? AdminLayout : AuthLayout">
    <RouterView v-slot="{ Component }">
      <Transition
        mode="out-in"
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        leave-active-class="transition-all duration-150 ease-in"
        leave-to-class="opacity-0">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </component>
</template>
