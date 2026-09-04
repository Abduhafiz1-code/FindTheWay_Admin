<script setup>
import { ref, onMounted, watch } from "vue";
import { useAdminStore } from "../stores/admin";
import { useStudentPlansStore } from "../stores/studentPlans";
import { useModuleSalesStore } from "../stores/moduleSales";
import AppIcon from "../components/AppIcon.vue";
import PageHeader from "../components/ui/PageHeader.vue";
import EmptyState from "../components/ui/EmptyState.vue";

const admin = useAdminStore();
const plans = useStudentPlansStore();
const sales = useModuleSalesStore();

const tab = ref("centers");
const receiptUrls = ref({});
const busy = ref(null);
const errorMessage = ref("");

// Admin chekni tasdiqlashda qancha summa to'lanishi kerakligini ko'radi
function planPrice(item) {
  const base = { pro: 200000, max: 350000 }[item.plan ?? "pro"] ?? 200000;
  const monthly = item.billing_cycle === "yearly" ? base * 0.7 : base;
  let per = monthly;
  if (item.is_extra_center && item.plan === "pro") per *= 0.8;
  if (item.is_extra_center && item.plan === "max") per = 0;
  return item.billing_cycle === "yearly"
    ? Math.round(per * 12)
    : Math.round(per);
}

function planLabel(item) {
  const plan = String(item.plan ?? "pro").toUpperCase();
  const cycle = item.billing_cycle === "yearly" ? "yillik" : "oylik";
  const extra = item.is_extra_center ? " · qo‘shimcha markaz" : "";
  return `${plan} · ${cycle}${extra}`;
}

async function loadReceiptsFor(list) {
  for (const item of list) {
    if (!item.receipt_url || receiptUrls.value[item.id]) continue;
    try {
      const { data } = await admin.getReceiptUrl(item.receipt_url);
      if (data) receiptUrls.value[item.id] = data;
    } catch (error) {
      errorMessage.value = error?.message || String(error);
    }
  }
}

async function loadReceipts() {
  await Promise.all([
    loadReceiptsFor(admin.subscriptions),
    loadReceiptsFor(plans.items),
    loadReceiptsFor(sales.items),
  ]);
}

async function decideCenter(item, action) {
  busy.value = item.id;
  errorMessage.value = "";
  try {
    if (action === "approve") await admin.approveSubscription(item.id);
    else await admin.rejectSubscription(item.id);
  } catch (error) {
    errorMessage.value = error?.message || String(error);
  } finally {
    busy.value = null;
  }
}

async function decideStudent(item, action) {
  busy.value = item.id;
  errorMessage.value = "";
  try {
    if (action === "approve") await plans.approve(item.id);
    else await plans.reject(item.id);
  } catch (error) {
    errorMessage.value = error?.message || String(error);
  } finally {
    busy.value = null;
  }
}

async function decideModule(item, action) {
  busy.value = item.id;
  errorMessage.value = "";
  try {
    if (action === "approve") await sales.approve(item.id);
    else await sales.reject(item.id);
  } catch (error) {
    errorMessage.value = error?.message || String(error);
  } finally {
    busy.value = null;
  }
}

watch(tab, async () => {
  errorMessage.value = "";
  await loadReceipts();
});

onMounted(async () => {
  await Promise.all([plans.loadPending(), sales.loadPending()]);
  await loadReceipts();
});
</script>

<template>
  <div>
    <PageHeader
      title="To‘lovlar"
      subtitle="Tasdiqlanishini kutayotgan to‘lov cheklari" />

    <!-- Yorliqlar -->
    <div class="mb-5 flex gap-2">
      <button
        type="button"
        class="btn btn-sm rounded-xl"
        :class="tab === 'centers' ? 'btn-primary' : 'btn-ghost'"
        @click="tab = 'centers'">
        <AppIcon name="building" :size="14" />
        Markaz obunalari
        <span class="ml-1 opacity-60">{{ admin.subscriptions.length }}</span>
      </button>
      <button
        type="button"
        class="btn btn-sm rounded-xl"
        :class="tab === 'students' ? 'btn-primary' : 'btn-ghost'"
        @click="tab = 'students'">
        <AppIcon name="cap" :size="14" />
        O‘quvchi Pro
        <span class="ml-1 opacity-60">{{ plans.items.length }}</span>
      </button>
      <button
        type="button"
        class="btn btn-sm rounded-xl"
        :class="tab === 'modules' ? 'btn-primary' : 'btn-ghost'"
        @click="tab = 'modules'">
        <AppIcon name="ticket" :size="14" />
        Modullar
        <span class="ml-1 opacity-60">{{ sales.items.length }}</span>
      </button>
    </div>

    <p v-if="errorMessage" class="mb-4 text-sm text-error">
      {{ errorMessage }}
    </p>

    <!-- ============ Markaz obunalari ============ -->
    <template v-if="tab === 'centers'">
      <EmptyState
        v-if="!admin.subscriptions.length"
        icon="wallet"
        title="Kutilayotgan to‘lovlar yo‘q"
        text="Yangi chek yuborilganda shu yerda ko‘rinadi." />
      <div v-else class="grid gap-4 xl:grid-cols-2">
        <article
          v-for="item in admin.subscriptions"
          :key="item.id"
          class="ftw-card overflow-hidden">
          <div class="flex items-start justify-between gap-4 p-5">
            <div class="min-w-0">
              <h2 class="truncate font-bold">
                {{ item.centers?.name || "Markaz" }}
              </h2>
              <p class="mt-1 text-xs font-semibold text-primary">
                {{ planPrice(item).toLocaleString("uz-UZ") }} so‘m
              </p>
              <p class="mt-0.5 text-xs opacity-55">
                {{ planLabel(item) }} ·
                {{ new Date(item.created_at).toLocaleString("uz-UZ") }}
              </p>
            </div>
            <span
              class="badge shrink-0"
              :class="item.status === 'trial' ? 'badge-info' : 'badge-warning'">
              {{ item.status === "trial" ? "chek kutmoqda" : "pending" }}
            </span>
          </div>
          <a
            v-if="receiptUrls[item.id]"
            :href="receiptUrls[item.id]"
            target="_blank"
            rel="noopener"
            class="block border-y border-base-content/10 bg-base-200/40 p-4">
            <img
              :src="receiptUrls[item.id]"
              alt="To‘lov cheki"
              class="mx-auto max-h-72 rounded-lg object-contain" />
          </a>
          <div
            v-else
            class="flex items-center justify-center border-y border-base-content/10 p-8 text-sm opacity-55">
            <AppIcon name="image" :size="18" class="mr-2" /> Chek topilmadi
          </div>
          <div class="flex gap-2 p-4">
            <button
              type="button"
              class="btn btn-success flex-1"
              :disabled="busy === item.id"
              @click="decideCenter(item, 'approve')">
              Tasdiqlash
            </button>
            <button
              type="button"
              class="btn btn-error btn-outline flex-1"
              :disabled="busy === item.id"
              @click="decideCenter(item, 'reject')">
              Rad etish
            </button>
          </div>
        </article>
      </div>
    </template>

    <!-- ============ O‘quvchi Pro ============ -->
    <template v-else-if="tab === 'students'">
      <EmptyState
        v-if="!plans.items.length"
        icon="cap"
        title="O‘quvchi Pro so‘rovlari yo‘q"
        text="O‘quvchi 30 000 so‘mlik chek yuborsa, shu yerda ko‘rinadi." />
      <div v-else class="grid gap-4 xl:grid-cols-2">
        <article
          v-for="item in plans.items"
          :key="item.id"
          class="ftw-card overflow-hidden">
          <div class="flex items-start justify-between gap-4 p-5">
            <div class="min-w-0">
              <h2 class="truncate font-bold">
                {{ item.profiles?.full_name || "O‘quvchi" }}
              </h2>
              <p class="mt-1 text-xs font-semibold text-primary">
                30 000 so‘m / oy · PRO
              </p>
              <p class="mt-0.5 text-xs opacity-55">
                {{ item.profiles?.phone || "Telefon yo‘q" }} ·
                {{ new Date(item.created_at).toLocaleString("uz-UZ") }}
              </p>
            </div>
            <span class="badge badge-warning shrink-0">pending</span>
          </div>
          <a
            v-if="receiptUrls[item.id]"
            :href="receiptUrls[item.id]"
            target="_blank"
            rel="noopener"
            class="block border-y border-base-content/10 bg-base-200/40 p-4">
            <img
              :src="receiptUrls[item.id]"
              alt="To‘lov cheki"
              class="mx-auto max-h-72 rounded-lg object-contain" />
          </a>
          <div
            v-else
            class="flex items-center justify-center border-y border-base-content/10 p-8 text-sm opacity-55">
            <AppIcon name="image" :size="18" class="mr-2" /> Chek topilmadi
          </div>
          <div class="flex gap-2 p-4">
            <button
              type="button"
              class="btn btn-success flex-1"
              :disabled="busy === item.id"
              @click="decideStudent(item, 'approve')">
              Pro faollashtirish
            </button>
            <button
              type="button"
              class="btn btn-error btn-outline flex-1"
              :disabled="busy === item.id"
              @click="decideStudent(item, 'reject')">
              Rad etish
            </button>
          </div>
        </article>
      </div>
    </template>

    <!-- ============ Modullar ============ -->
    <template v-else>
      <EmptyState
        v-if="!sales.items.length"
        icon="ticket"
        title="Modul xaridlari yo‘q"
        text="Markaz modul sotib olish uchun chek yuborsa, shu yerda ko‘rinadi." />
      <div v-else class="grid gap-4 xl:grid-cols-2">
        <article
          v-for="item in sales.items"
          :key="item.id"
          class="ftw-card overflow-hidden">
          <div class="flex items-start justify-between gap-4 p-5">
            <div class="min-w-0">
              <h2 class="truncate font-bold">
                {{ item.modules?.name || "Modul" }}
                <span class="ml-1 text-xs font-semibold opacity-50">—
                  {{ item.centers?.name || "Markaz" }}
                </span>
              </h2>
              <p class="mt-1 text-xs font-semibold text-primary">
                {{ (item.modules?.price_monthly ?? 0).toLocaleString("uz-UZ") }} so‘m / oy
              </p>
              <p class="mt-0.5 text-xs opacity-55">
                {{ new Date(item.created_at).toLocaleString("uz-UZ") }}
              </p>
            </div>
            <span class="badge badge-warning shrink-0">pending</span>
          </div>
          <a
            v-if="receiptUrls[item.id]"
            :href="receiptUrls[item.id]"
            target="_blank"
            rel="noopener"
            class="block border-y border-base-content/10 bg-base-200/40 p-4">
            <img
              :src="receiptUrls[item.id]"
              alt="To‘lov cheki"
              class="mx-auto max-h-72 rounded-lg object-contain" />
          </a>
          <div
            v-else
            class="flex items-center justify-center border-y border-base-content/10 p-8 text-sm opacity-55">
            <AppIcon name="image" :size="18" class="mr-2" /> Chek topilmadi
          </div>
          <div class="flex gap-2 p-4">
            <button
              type="button"
              class="btn btn-success flex-1"
              :disabled="busy === item.id"
              @click="decideModule(item, 'approve')">
              Faollashtirish
            </button>
            <button
              type="button"
              class="btn btn-error btn-outline flex-1"
              :disabled="busy === item.id"
              @click="decideModule(item, 'reject')">
              Rad etish
            </button>
          </div>
        </article>
      </div>
    </template>
  </div>
</template>
