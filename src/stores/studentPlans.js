import { ref } from "vue";
import { defineStore } from "pinia";
import { supabase } from "../supabase";

/**
 * O'quvchi Pro cheklarini tasdiqlash.
 */
export const useStudentPlansStore = defineStore("studentPlans", () => {
  const items = ref([]);
  const loading = ref(false);
  const lastError = ref("");

  async function loadPending() {
    loading.value = true;
    const { data, error } = await supabase
      .from("student_plans")
      .select(
        "id, student_id, tier, status, paid_until, receipt_url, created_at, profiles ( id, full_name, phone )",
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

  async function approve(planId) {
    const item = items.value.find((x) => x.id === planId);
    const start =
      item?.paid_until && new Date(item.paid_until) > new Date()
        ? new Date(item.paid_until)
        : new Date();
    const paidUntil = new Date(start);
    paidUntil.setDate(paidUntil.getDate() + 30);

    const { error } = await supabase
      .from("student_plans")
      .update({
        tier: "pro",
        status: "active",
        paid_until: paidUntil.toISOString(),
      })
      .eq("id", planId);
    if (error) throw error;
    items.value = items.value.filter((x) => x.id !== planId);
  }

  async function reject(planId) {
    const { error } = await supabase
      .from("student_plans")
      .update({ tier: "free", status: "free", receipt_url: null })
      .eq("id", planId);
    if (error) throw error;
    items.value = items.value.filter((x) => x.id !== planId);
  }

  return { items, loading, lastError, loadPending, approve, reject };
});
