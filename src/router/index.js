import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { layout: 'main', requiresAuth: true, title: 'Boshqaruv · FindTheWay Admin' },
  },
  {
    path: '/markazlar',
    name: 'centers',
    component: () => import('../views/CentersView.vue'),
    meta: { layout: 'main', requiresAuth: true, title: 'Markazlar · FindTheWay Admin' },
  },
  {
    path: '/markaz/:id',
    name: 'center',
    component: () => import('../views/CenterDetailView.vue'),
    meta: { layout: 'main', requiresAuth: true, title: 'Markaz · FindTheWay Admin' },
  },
  {
    path: '/foydalanuvchilar',
    name: 'users',
    component: () => import('../views/UsersView.vue'),
    meta: { layout: 'main', requiresAuth: true, title: 'Foydalanuvchilar · FindTheWay Admin' },
  },
  {
    path: '/arizalar',
    name: 'applications',
    component: () => import('../views/ApplicationsView.vue'),
    meta: { layout: 'main', requiresAuth: true, title: 'Arizalar · FindTheWay Admin' },
  },
  {
    path: '/sozlamalar',
    name: 'settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { layout: 'main', requiresAuth: true, title: 'Sozlamalar · FindTheWay Admin' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { layout: 'auth', guest: true, title: 'Kirish · FindTheWay Admin' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { layout: 'main', requiresAuth: true, title: '404 · FindTheWay Admin' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.path === from.path) return false
    return { top: 0, behavior: 'smooth' }
  },
})

// Butun panel yopiq — faqat admin roli bilan kirish mumkin.
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.waitUntilReady()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: to.fullPath === '/' ? undefined : { redirect: to.fullPath } }
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }

  return true
})

router.afterEach((to) => {
  if (to.meta?.title) document.title = to.meta.title
})

export default router
