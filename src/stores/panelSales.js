import { ref } from "vue";
import { defineStore } from "pinia";
import { supabase } from "../supabase";

/**
 * Tayyor panel xaridlarini tasdiqlash (Biznes panelidagi do'kondan).
 */
export const usePanelSalesStore = defineStore("panelSales", () => {
  const items = ref([]);
  const loading = ref(false);
  const lastError = ref("");

  async function loadPending() {
    loading.value = true;
    const { data, error } = await supabase
      .from("center_panels")
      .select(
        "id, center_id, panel_id, status, paid_until, receipt_url, created_at, centers ( id, name ), panel_products ( id, name, price_monthly, tier )",
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
      .from("center_panels")
      .update({ status: "active", paid_until: paidUntil.toISOString() })
      .eq("id", saleId);
    if (error) throw error;
    items.value = items.value.filter((x) => x.id !== saleId);
  }

  async function reject(saleId) {
    const { error } = await supabase
      .from("center_panels")
      .update({ status: "expired", receipt_url: null })
      .eq("id", saleId);
    if (error) throw error;
    items.value = items.value.filter((x) => x.id !== saleId);
  }

  return { items, loading, lastError, loadPending, approve, reject };
});
