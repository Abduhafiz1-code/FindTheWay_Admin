<script setup>
import { ref, onMounted } from "vue";
import { useAdminStore } from "../stores/admin";
import AppIcon from "../components/AppIcon.vue";
import PageHeader from "../components/ui/PageHeader.vue";
import EmptyState from "../components/ui/EmptyState.vue";

const admin = useAdminStore();
const receiptUrls = ref({});
const busy = ref(null);
const errorMessage = ref("");

async function loadReceipts() {
  for (const item of admin.subscriptions) {
    if (!item.receipt_url) continue;
    try {
      receiptUrls.value[item.id] = await admin.getReceiptUrl(item.receipt_url);
    } catch (error) {
      errorMessage.value = error?.message || String(error);
    }
  }
}

async function decide(item, action) {
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

onMounted(loadReceipts);
</script>

<template>
  <div>
    <PageHeader
      title="To‘lovlar"
      subtitle="Tasdiqlanishini kutayotgan to‘lov cheklari" />
    <p v-if="errorMessage" class="mb-4 text-sm text-error">
      {{ errorMessage }}
    </p>
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
          <div>
            <h2 class="font-bold">{{ item.centers?.name || "Markaz" }}</h2>
            <p class="mt-1 text-xs opacity-55">
              {{ new Date(item.created_at).toLocaleString("uz-UZ") }}
            </p>
          </div>
          <span class="badge badge-warning">pending</span>
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
            @click="decide(item, 'approve')">
            Tasdiqlash
          </button>
          <button
            type="button"
            class="btn btn-error btn-outline flex-1"
            :disabled="busy === item.id"
            @click="decide(item, 'reject')">
            Rad etish
          </button>
        </div>
      </article>
    </div>
  </div>
</template>
