import { ref } from "vue";
import { defineStore } from "pinia";
import { supabase } from "../supabase";

/**
 * Modul xaridlarini tasdiqlash (Biznes panelidagi do'kondan).
 */
export const useModuleSalesStore = defineStore("moduleSales", () => {
  const items = ref([]);
  const loading = ref(false);
  const lastError = ref("");

  async function loadPending() {
    loading.value = true;
    const { data, error } = await supabase
      .from("center_modules")
      .select(
        "id, center_id, module_id, status, paid_until, receipt_url, created_at, centers ( id, name ), modules ( id, name, price_monthly )",
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    loading.value = false;
    if (error) {
      lastError.value = error.message;
      return [];
    }
    items.value = data ?? [];
    return items.value;
  }

  async function approve(saleId) {
    const item = items.value.find((x) => x.id === saleId);
    // Uzaytirish bo'lsa — oldingi muddatdan davom etadi
    const start =
      item?.paid_until && new Date(item.paid_until) > new Date()
        ? new Date(item.paid_until)
        : new Date();
    const paidUntil = new Date(start);
    paidUntil.setDate(paidUntil.getDate() + 30);

    const { error } = await supabase
      .from("center_modules")
      .update({ status: "active", paid_until: paidUntil.toISOString() })
      .eq("id", saleId);
    if (error) throw error;
    items.value = items.value.filter((x) => x.id !== saleId);
  }

  async function reject(saleId) {
    const { error } = await supabase
      .from("center_modules")
      .update({ status: "expired", receipt_url: null })
      .eq("id", saleId);
    if (error) throw error;
    items.value = items.value.filter((x) => x.id !== saleId);
  }

  return { items, loading, lastError, loadPending, approve, reject };
});
