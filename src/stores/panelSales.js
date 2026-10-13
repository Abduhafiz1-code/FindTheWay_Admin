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

  /**
   * Tasdiqlash — approve_panel(p_sale_id, p_days) RPC.
   * Bazada:
   *  • status = 'active', paid_until = eski muddatdan +30 kun
   *  • panel_events ga 'activated'/'upgraded' yoziladi va OCHILGAN
   *    vositalar farqi (added_tools) payloadga qo'yiladi —
   *    markaz egasi "Nimalar ochildi" oynasini ko'radi.
   */
  async function approve(saleId, days = 30) {
    const { data, error } = await supabase.rpc("approve_panel", {
      p_sale_id: saleId,
      p_days: days,
    });
    if (error) throw error;
    items.value = items.value.filter((x) => x.id !== saleId);
    return data;
  }

  /** Rad etish — reject_panel(p_sale_id) RPC (chek yaroqsiz + tarix) */
  async function reject(saleId) {
    const { error } = await supabase.rpc("reject_panel", {
      p_sale_id: saleId,
    });
    if (error) throw error;
    items.value = items.value.filter((x) => x.id !== saleId);
  }

  return { items, loading, lastError, loadPending, approve, reject };
});
