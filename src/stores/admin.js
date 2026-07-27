import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../supabase'

// Yo'nalishlar — `centers.category` ustunidagi qiymatlar bilan bir xil
export const CATEGORIES = [
  { key: 'language', icon: 'globe', tone: 'primary' },
  { key: 'it', icon: 'columns', tone: 'accent' },
  { key: 'math', icon: 'target', tone: 'secondary' },
  { key: 'exam', icon: 'cap', tone: 'info' },
  { key: 'design', icon: 'palette', tone: 'primary' },
  { key: 'business', icon: 'trending', tone: 'success' },
  { key: 'music', icon: 'sparkles', tone: 'accent' },
  { key: 'sport', icon: 'award', tone: 'secondary' },
]

export const DISTRICTS = [
  'Bektemir',
  'Chilonzor',
  'Mirobod',
  'Mirzo Ulug‘bek',
  'Olmazor',
  'Sergeli',
  'Shayxontohur',
  'Uchtepa',
  'Yakkasaroy',
  'Yashnobod',
  'Yunusobod',
]

export const APPLICATION_STATUSES = ['new', 'seen', 'contacted', 'accepted', 'rejected']

export const STATUS_META = {
  new: { labelKey: 'status.new', badge: 'badge-primary', dot: 'bg-primary', icon: 'send' },
  seen: { labelKey: 'status.seen', badge: 'badge-ghost', dot: 'bg-base-content/40', icon: 'eyeSolid' },
  contacted: { labelKey: 'status.contacted', badge: 'badge-info', dot: 'bg-info', icon: 'phone' },
  accepted: { labelKey: 'status.accepted', badge: 'badge-success', dot: 'bg-success', icon: 'checkCircle' },
  rejected: { labelKey: 'status.rejected', badge: 'badge-error', dot: 'bg-error', icon: 'xCircle' },
}

// Foydalanuvchi rollari
export const ROLES = ['student', 'owner', 'admin']

export const ROLE_META = {
  student: { labelKey: 'roles.student', badge: 'badge-ghost', icon: 'cap' },
  owner: { labelKey: 'roles.owner', badge: 'badge-info', icon: 'building' },
  admin: { labelKey: 'roles.admin', badge: 'badge-primary', icon: 'shield' },
}

const CENTER_FIELDS =
  'id, owner_id, name, description, district, address, phone, website, category, price_from, rating, is_verified, created_at'

const PROFILE_FIELDS = 'id, role, full_name, center_name, phone, avatar_url, created_at'

const APPLICATION_FIELDS =
  'id, center_id, course_id, course_name, student_id, student_name, student_phone, student_email, message, status, created_at'

/**
 * FindTheWay Admin — platformadagi barcha ma'lumot shu yerda.
 * Hammasini bir marta yuklab, filtrlash va statistikani mijoz
 * tomonida hisoblaymiz — panel tez ishlaydi va so'rov kam ketadi.
 */
export const useAdminStore = defineStore('admin', () => {
  const centers = ref([])
  const profiles = ref([])
  const applications = ref([])
  const courses = ref([])

  const loading = ref(false)
  const loaded = ref(false)
  const lastError = ref('')

  // ---------------------------------------------------------------
  // Yuklash
  // ---------------------------------------------------------------
  async function loadAll(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    lastError.value = ''
    try {
      const [c, p, a, k] = await Promise.all([
        supabase.from('centers').select(CENTER_FIELDS).order('created_at', { ascending: false }),
        supabase.from('profiles').select(PROFILE_FIELDS).order('created_at', { ascending: false }),
        supabase
          .from('applications')
          .select(APPLICATION_FIELDS)
          .order('created_at', { ascending: false }),
        supabase.from('courses').select('id, center_id, name, price, is_active'),
      ])

      const firstError = c.error || p.error || a.error || k.error
      if (firstError) lastError.value = firstError.message

      centers.value = c.data ?? []
      profiles.value = p.data ?? []
      applications.value = a.data ?? []
      courses.value = k.data ?? []
      loaded.value = true
    } catch (e) {
      lastError.value = e?.message ?? 'Xatolik'
    } finally {
      loading.value = false
    }
  }

  // ---------------------------------------------------------------
  // Qidirish yordamchilari
  // ---------------------------------------------------------------
  function centerById(id) {
    return centers.value.find((c) => String(c.id) === String(id)) ?? null
  }

  function profileById(id) {
    if (!id) return null
    return profiles.value.find((p) => String(p.id) === String(id)) ?? null
  }

  function centerName(id) {
    return centerById(id)?.name ?? '—'
  }

  function coursesOf(centerId) {
    return courses.value.filter((c) => String(c.center_id) === String(centerId))
  }

  function applicationsOf(centerId) {
    return applications.value.filter((a) => String(a.center_id) === String(centerId))
  }

  // ---------------------------------------------------------------
  // Statistika
  // ---------------------------------------------------------------
  const stats = computed(() => {
    const byStatus = {}
    APPLICATION_STATUSES.forEach((s) => {
      byStatus[s] = 0
    })
    applications.value.forEach((a) => {
      if (byStatus[a.status] !== undefined) byStatus[a.status] += 1
    })

    const byRole = { student: 0, owner: 0, admin: 0 }
    profiles.value.forEach((p) => {
      if (byRole[p.role] !== undefined) byRole[p.role] += 1
    })

    const verified = centers.value.filter((c) => c.is_verified).length

    return {
      centers: centers.value.length,
      verified,
      pending: centers.value.length - verified,
      courses: courses.value.length,
      users: profiles.value.length,
      applications: applications.value.length,
      byStatus,
      byRole,
    }
  })

  // Yo'nalishlar bo'yicha markazlar soni — dashboard ustunlari uchun
  const categoryBreakdown = computed(() =>
    CATEGORIES.map((cat) => ({
      ...cat,
      count: centers.value.filter((c) => c.category === cat.key).length,
    })).sort((a, b) => b.count - a.count),
  )

  // Tumanlar bo'yicha markazlar soni
  const districtBreakdown = computed(() => {
    const map = new Map()
    centers.value.forEach((c) => {
      if (!c.district) return
      map.set(c.district, (map.get(c.district) ?? 0) + 1)
    })
    return [...map.entries()]
      .map(([district, count]) => ({ district, count }))
      .sort((a, b) => b.count - a.count)
  })

  // Tasdiqlanishini kutayotgan markazlar — dashboard'da darhol ko'rinadi
  const pendingCenters = computed(() => centers.value.filter((c) => !c.is_verified))

  // Oxirgi 7 kunda kelgan arizalar — kichik ustunli grafik uchun
  const applicationsTrend = computed(() => {
    const days = []
    const now = new Date()
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      d.setHours(0, 0, 0, 0)
      days.push({ date: d, count: 0 })
    }
    applications.value.forEach((a) => {
      if (!a.created_at) return
      const created = new Date(a.created_at)
      created.setHours(0, 0, 0, 0)
      const hit = days.find((d) => d.date.getTime() === created.getTime())
      if (hit) hit.count += 1
    })
    return days
  })

  const recentApplications = computed(() => applications.value.slice(0, 6))
  const recentUsers = computed(() => profiles.value.slice(0, 6))

  // ---------------------------------------------------------------
  // Amallar
  // ---------------------------------------------------------------
  async function setVerified(centerId, value) {
    const { data, error } = await supabase
      .from('centers')
      .update({ is_verified: value })
      .eq('id', centerId)
      .select(CENTER_FIELDS)
      .single()
    if (error) throw error
    const index = centers.value.findIndex((c) => String(c.id) === String(centerId))
    if (index !== -1) centers.value[index] = data
    return data
  }

  async function updateCenter(centerId, patch) {
    const { data, error } = await supabase
      .from('centers')
      .update(patch)
      .eq('id', centerId)
      .select(CENTER_FIELDS)
      .single()
    if (error) throw error
    const index = centers.value.findIndex((c) => String(c.id) === String(centerId))
    if (index !== -1) centers.value[index] = data
    return data
  }

  async function deleteCenter(centerId) {
    const { error } = await supabase.from('centers').delete().eq('id', centerId)
    if (error) throw error
    centers.value = centers.value.filter((c) => String(c.id) !== String(centerId))
    applications.value = applications.value.filter((a) => String(a.center_id) !== String(centerId))
    courses.value = courses.value.filter((c) => String(c.center_id) !== String(centerId))
  }

  async function setRole(profileId, role) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', profileId)
      .select(PROFILE_FIELDS)
      .single()
    if (error) throw error
    const index = profiles.value.findIndex((p) => String(p.id) === String(profileId))
    if (index !== -1) profiles.value[index] = data
    return data
  }

  async function setApplicationStatus(id, status) {
    const { data, error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', id)
      .select(APPLICATION_FIELDS)
      .single()
    if (error) throw error
    const index = applications.value.findIndex((a) => String(a.id) === String(id))
    if (index !== -1) applications.value[index] = data
    return data
  }

  async function deleteApplication(id) {
    const { error } = await supabase.from('applications').delete().eq('id', id)
    if (error) throw error
    applications.value = applications.value.filter((a) => String(a.id) !== String(id))
  }

  function reset() {
    centers.value = []
    profiles.value = []
    applications.value = []
    courses.value = []
    loaded.value = false
  }

  return {
    centers,
    profiles,
    applications,
    courses,
    loading,
    loaded,
    lastError,
    stats,
    categoryBreakdown,
    districtBreakdown,
    pendingCenters,
    applicationsTrend,
    recentApplications,
    recentUsers,
    loadAll,
    centerById,
    profileById,
    centerName,
    coursesOf,
    applicationsOf,
    setVerified,
    updateCenter,
    deleteCenter,
    setRole,
    setApplicationStatus,
    deleteApplication,
    reset,
  }
})
