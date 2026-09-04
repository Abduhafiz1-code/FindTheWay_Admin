import { ref } from "vue";
import { defineStore } from "pinia";
import { supabase } from "../supabase";
import { useAuthStore } from "./auth";

/**
 * Yordam ticketlari — foydalanuvchilar ochadi, admin javob beradi.
 * Admin javobini Groq "polish-message" funksiyasi bilan silliqlashi mumkin.
 */
export const useSupportStore = defineStore("support", () => {
  const tickets = ref([]);
  const activeTicket = ref(null);
  const messages = ref([]);
  const loading = ref(false);
  const loadingMessages = ref(false);
  const sending = ref(false);
  const polishing = ref(false);
  const lastError = ref("");

  let listChannel = null;
  let msgChannel = null;

  function note(error, context) {
    if (!error) return;
    lastError.value = error.message || String(error);
    console.warn(`[FindTheWay Admin] ${context}:`, lastError.value);
  }

  async function loadTickets() {
    loading.value = true;
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(100);
    loading.value = false;
    if (error) {
      note(error, "Ticketlarni yuklash");
      return [];
    }
    tickets.value = data ?? [];
    return tickets.value;
  }

  async function openTicket(ticket) {
    unsubscribeMessages();
    activeTicket.value = ticket;
    messages.value = [];
    loadingMessages.value = true;
    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });
    loadingMessages.value = false;
    if (error) {
      note(error, "Xabarlarni yuklash");
      return [];
    }
    messages.value = data ?? [];
    subscribeMessages(ticket.id);
    return messages.value;
  }

  async function sendMessage(body) {
    const auth = useAuthStore();
    const ticket = activeTicket.value;
    const text = String(body ?? "").trim();
    if (!ticket || !text) return null;

    sending.value = true;
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: ticket.id,
          sender_id: auth.user.id,
          sender_role: "admin",
          sender_name: auth.displayName || "Admin",
          body: text,
        })
        .select("*")
        .single();
      if (error) throw error;
      if (data && !messages.value.some((m) => m.id === data.id)) {
        messages.value = [...messages.value, data];
      }
      return data;
    } catch (error) {
      note(error, "Xabar yuborish");
      throw error;
    } finally {
      sending.value = false;
    }
  }

  /** Admin javobini AI bilan silliqlash — natija qaytariladi */
  async function polish(text) {
    polishing.value = true;
    try {
      const { data, error } = await supabase.functions.invoke("polish-message", {
        body: { text },
      });
      if (error) throw error;
      if (!data?.polished) throw new Error("AI javob qaytarmadi");
      return data.polished;
    } catch (error) {
      note(error, "AI silliqlash");
      throw error;
    } finally {
      polishing.value = false;
    }
  }

  async function setStatus(ticketId, status) {
    const { data, error } = await supabase
      .from("support_tickets")
      .update({ status })
      .eq("id", ticketId)
      .select("*")
      .single();
    if (error) {
      note(error, "Holatni yangilash");
      throw error;
    }
    const index = tickets.value.findIndex((t) => t.id === ticketId);
    if (index !== -1) tickets.value[index] = data;
    if (activeTicket.value?.id === ticketId) activeTicket.value = data;
    return data;
  }

  // Ticketlar ro'yxati jonli (yangi xabar/ticket kelganda)
  function subscribeList() {
    if (listChannel) return;
    listChannel = supabase
      .channel("support-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_tickets",
        },
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new) {
            if (!tickets.value.some((t) => t.id === payload.new.id)) {
              tickets.value = [payload.new, ...tickets.value];
            }
          } else if (
            (payload.eventType === "UPDATE" || payload.eventType === "DELETE") &&
            payload.new
          ) {
            const index = tickets.value.findIndex(
              (t) => t.id === payload.new.id,
            );
            if (index !== -1) {
              if (payload.eventType === "DELETE") tickets.value.splice(index, 1);
              else tickets.value[index] = payload.new;
            }
          }
        },
      )
      .subscribe();
  }

  function subscribeMessages(ticketId) {
    if (!ticketId || msgChannel) return;
    msgChannel = supabase
      .channel(`support-msg-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          if (
            payload.new &&
            !messages.value.some((m) => m.id === payload.new.id)
          ) {
            messages.value = [...messages.value, payload.new];
          }
        },
      )
      .subscribe();
  }

  function unsubscribeMessages() {
    if (msgChannel) {
      supabase.removeChannel(msgChannel);
      msgChannel = null;
    }
  }

  function unsubscribeAll() {
    unsubscribeMessages();
    if (listChannel) {
      supabase.removeChannel(listChannel);
      listChannel = null;
    }
  }

  function reset() {
    unsubscribeAll();
    tickets.value = [];
    activeTicket.value = null;
    messages.value = [];
    lastError.value = "";
  }

  return {
    tickets,
    activeTicket,
    messages,
    loading,
    loadingMessages,
    sending,
    polishing,
    lastError,
    loadTickets,
    subscribeList,
    openTicket,
    sendMessage,
    polish,
    setStatus,
    unsubscribeAll,
    reset,
  };
});
