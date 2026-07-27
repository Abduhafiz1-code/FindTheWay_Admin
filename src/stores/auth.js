import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../supabase'

/**
 * FindTheWay Admin — autentifikatsiya store.
 *
 * Farqi: bu yerda ro'yxatdan o'tish YO'Q. Admin hisobi faqat
 * Supabase'da qo'lda beriladi (supabase_admin.sql ga qarang).
 * Kirgan odam admin bo'lmasa — seans darhol yopiladi.
 */
export const useAuthStore = defineStore('auth', () => {
  const session = ref(null)
  const profile = ref(null)
  const loading = ref(true)
  const ready = ref(false)
  const deniedReason = ref('')

  const user = computed(() => session.value?.user ?? null)
  const role = computed(() => profile.value?.role ?? user.value?.user_metadata?.role ?? null)
  const isAdmin = computed(() => role.value === 'admin')
  // Panelga faqat admin roli bilan kirgan odam kira oladi
  const isAuthenticated = computed(() => !!session.value && isAdmin.value)

  const displayName = computed(
    () =>
      profile.value?.full_name ||
      user.value?.user_metadata?.full_name ||
      user.value?.email?.split('@')[0] ||
      '',
  )

  const initials = computed(() => {
    const name = displayName.value.trim()
    if (!name) return 'A'
    const parts = name.split(/\s+/).slice(0, 2)
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('')
  })

  const email = computed(() => user.value?.email ?? '')
  const phone = computed(() => profile.value?.phone || '')

  async function fetchProfile() {
    if (!user.value) {
      profile.value = null
      return null
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, full_name, center_name, phone, avatar_url, created_at')
      .eq('id', user.value.id)
      .maybeSingle()

    if (error) {
      console.warn('[FindTheWay Admin] Profilni yuklab bo\'lmadi:', error.message)
      profile.value = null
      return null
    }
    profile.value = data
    return data
  }

  async function init() {
    try {
      const { data } = await supabase.auth.getSession()
      session.value = data.session
      if (session.value) await fetchProfile()
    } finally {
      loading.value = false
      ready.value = true
    }

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      session.value = newSession
      if (newSession) await fetchProfile()
      else profile.value = null
    })
  }

  async function waitUntilReady() {
    if (ready.value) return
    await new Promise((resolve) => {
      const timer = setInterval(() => {
        if (ready.value) {
          clearInterval(timer)
          resolve()
        }
      }, 30)
    })
  }

  /**
   * Kirish. Parol to'g'ri bo'lsa ham, roli 'admin' bo'lmasa
   * seansni bekor qilamiz va sababini qaytaramiz.
   */
  async function signIn(emailValue, password) {
    deniedReason.value = ''
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailValue,
      password,
    })
    if (error) throw error

    session.value = data.session
    await fetchProfile()

    if (!isAdmin.value) {
      await supabase.auth.signOut()
      session.value = null
      profile.value = null
      deniedReason.value = 'notAdmin'
      const err = new Error('NOT_ADMIN')
      err.code = 'NOT_ADMIN'
      throw err
    }
    return data
  }

  async function updateProfile({ fullName, phone: newPhone }) {
    if (!user.value) throw new Error('Avval tizimga kiring.')
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.value.id,
          role: 'admin',
          full_name: fullName ?? null,
          phone: newPhone ?? null,
        },
        { onConflict: 'id' },
      )
      .select('id, role, full_name, center_name, phone, avatar_url, created_at')
      .single()
    if (error) throw error
    profile.value = data

    const meta = user.value.user_metadata ?? {}
    await supabase.auth.updateUser({
      data: { ...meta, full_name: fullName ?? null, phone: newPhone ?? null },
    })
    return data
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    session.value = null
    profile.value = null
  }

  return {
    session,
    profile,
    user,
    loading,
    ready,
    role,
    isAdmin,
    isAuthenticated,
    deniedReason,
    displayName,
    initials,
    email,
    phone,
    init,
    waitUntilReady,
    fetchProfile,
    updateProfile,
    updatePassword,
    signIn,
    signOut,
  }
})
