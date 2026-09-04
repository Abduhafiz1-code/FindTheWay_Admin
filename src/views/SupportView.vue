<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useSupportStore } from "../stores/support";
import AppIcon from "../components/AppIcon.vue";
import EmptyState from "../components/ui/EmptyState.vue";

const support = useSupportStore();

const draft = ref("");
const chatBox = ref(null);
const filter = ref("all");
const aiError = ref("");

const STATUS_META = {
  open: { label: "Ochiq", badge: "badge-primary", dot: "bg-primary" },
  answered: { label: "Javob berildi", badge: "badge-info", dot: "bg-info" },
  closed: { label: "Yopilgan", badge: "badge-ghost", dot: "bg-base-content/40" },
};

const counts = computed(() => {
  const map = { all: support.tickets.length };
  for (const key of ["open", "answered", "closed"]) {
    map[key] = support.tickets.filter((t) => t.status === key).length;
  }
  return map;
});

const visible = computed(() =>
  filter.value === "all"
    ? support.tickets
    : support.tickets.filter((t) => t.status === filter.value),
);

const active = computed(() => support.activeTicket);
const isMine = (message) => message.sender_role === "admin";

function meta(status) {
  return STATUS_META[status] ?? STATUS_META.open;
}

function shortDate(value) {
  if (!value) return "";
  const d = new Date(value);
  const now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" });
}

async function scrollDown() {
  await nextTick();
  if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight;
}

async function openTicket(ticket) {
  aiError.value = "";
  await support.openTicket(ticket);
  await scrollDown();
}

async function send() {
  const text = draft.value.trim();
  if (!text || support.sending) return;
  aiError.value = "";
  try {
    await support.sendMessage(text);
    draft.value = "";
    await scrollDown();
  } catch (error) {
    support.lastError = error?.message || String(error);
  }
}

async function applyAI() {
  const text = draft.value.trim();
  if (!text) return;
  aiError.value = "";
  try {
    const polished = await support.polish(text);
    draft.value = polished;
    await scrollDown();
  } catch (error) {
    aiError.value = error?.message || String(error);
  }
}

async function changeStatus(status) {
  if (!active.value) return;
  try {
    await support.setStatus(active.value.id, status);
  } catch (error) {
    support.lastError = error?.message || String(error);
  }
}

watch(
  () => [support.messages.length, support.activeTicket?.id],
  async () => {
    await scrollDown();
  },
);

onMounted(async () => {
  await support.loadTickets();
  support.subscribeList();
});

onUnmounted(() => support.unsubscribeAll());
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-black tracking-tight">Yordam (support)</h1>
        <p class="mt-1 text-sm opacity-60">
          Foydalanuvchilarning savollari — javob yozing, AI tugmasi matnni
          silliqlaydi.
        </p>
      </div>
      <span v-if="counts.open" class="badge badge-primary">
        {{ counts.open }} ta ochiq
      </span>
    </div>

    <p
      v-if="support.lastError"
      class="rounded-xl border border-error/30 bg-error/10 px-3.5 py-2.5 text-sm text-error">
      {{ support.lastError }}
    </p>

    <!-- Status filtri -->
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="key in ['all', 'open', 'answered', 'closed']"
        :key="key"
        type="button"
        class="rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
        :class="
          filter === key
            ? 'bg-primary text-primary-content'
            : 'bg-base-content/6 hover:bg-base-content/12'
        "
        @click="filter = key">
        {{
          key === "all"
            ? "Hammasi"
            : (STATUS_META[key] ?? STATUS_META.open).label
        }}
        <span class="ml-1 opacity-60">{{ counts[key] }}</span>
      </button>
    </div>

    <div class="grid gap-5 xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
      <!-- Ro'yxat -->
      <div class="space-y-2.5" :class="active ? 'hidden xl:block' : ''">
        <p
          v-if="!visible.length"
          class="rounded-xl bg-base-200/50 px-4 py-6 text-center text-sm opacity-60">
          Ticketlar yo'q.
        </p>
        <button
          v-for="ticket in visible"
          :key="ticket.id"
          type="button"
          class="ftw-card w-full p-4 text-left transition-colors hover:bg-base-100"
          :class="ticket.id === active?.id ? 'ring-2 ring-primary/40' : ''"
          @click="openTicket(ticket)">
          <div class="flex items-start gap-3">
            <span
              class="mt-1.5 size-2 shrink-0 rounded-full"
              :class="meta(ticket.status).dot" />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-bold">{{
                ticket.subject
              }}</span>
              <span class="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs opacity-60">
                <span class="font-semibold">{{ ticket.user_name }}</span>
                <span
                  class="rounded bg-base-content/8 px-1.5 py-0.5 text-[10px] font-bold uppercase">
                  {{ ticket.user_role === "owner" ? "markaz" : "o'quvchi" }}
                </span>
              </span>
              <span class="mt-1.5 flex items-center gap-2 text-[11px] opacity-45">
                {{ shortDate(ticket.updated_at) }}
              </span>
            </span>
          </div>
        </button>
      </div>

      <!-- Chat -->
      <div
        v-if="active"
        class="ftw-card flex h-[74vh] flex-col overflow-hidden xl:sticky xl:top-20">
        <div class="border-b border-base-content/10 p-4">
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-circle xl:hidden"
              @click="support.activeTicket = null">
              <AppIcon name="arrowLeft" :size="17" />
            </button>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold">{{ active.subject }}</p>
              <p class="truncate text-xs opacity-55">
                {{ active.user_name }} ·
                {{ active.user_role === "owner" ? "markaz egasi" : "o'quvchi" }}
                · {{ shortDate(active.created_at) }}
              </p>
            </div>
            <span
              class="badge"
              :class="meta(active.status).badge">
              {{ meta(active.status).label }}
            </span>
          </div>
          <div class="mt-3 flex flex-wrap items-center gap-1.5">
            <span class="mr-1 text-[11px] font-bold uppercase tracking-wide opacity-45">
              Holat:
            </span>
            <button
              v-for="(item, key) in STATUS_META"
              :key="key"
              type="button"
              class="btn btn-xs rounded-lg"
              :class="active.status === key ? 'btn-primary' : 'btn-ghost'"
              @click="changeStatus(key)">
              {{ item.label }}
            </button>
          </div>
        </div>

        <!-- Xabarlar -->
        <div
          ref="chatBox"
          class="flex-1 space-y-3 overflow-y-auto bg-base-200/30 p-4">
          <p
            v-if="!support.messages.length"
            class="py-10 text-center text-sm opacity-50">
            Xabarlar yo'q. Birinchi javobni yozing.
          </p>
          <div
            v-for="message in support.messages"
            :key="message.id"
            class="flex"
            :class="isMine(message) ? 'justify-end' : 'justify-start'">
            <div
              class="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
              :class="
                isMine(message)
                  ? 'rounded-br-md bg-primary text-primary-content'
                  : 'rounded-bl-md bg-base-100'
              ">
              <p class="text-[10px] font-bold opacity-60">{{
                message.sender_name
              }}</p>
              <p class="mt-0.5 whitespace-pre-wrap">{{ message.body }}</p>
              <p
                class="mt-1 text-[10px]"
                :class="isMine(message) ? 'opacity-60' : 'opacity-40'">
                {{ shortDate(message.created_at) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Yozish -->
        <div class="border-t border-base-content/10 bg-base-100 p-3">
          <p v-if="aiError" class="mb-2 text-xs text-error">{{ aiError }}</p>
          <textarea
            v-model="draft"
            rows="3"
            class="textarea textarea-bordered w-full resize-none rounded-xl text-sm"
            placeholder="Javob yozing…" />
          <div class="mt-2 flex items-center gap-2">
            <button
              type="button"
              class="btn btn-outline btn-sm rounded-lg"
              :disabled="!draft.trim() || support.polishing"
              @click="applyAI">
              <span v-if="support.polishing" class="loading loading-spinner loading-xs" />
              <AppIcon v-else name="sparkles" :size="14" />
              AI silliqlash
            </button>
            <span class="flex-1" />
            <button
              type="button"
              class="btn btn-primary btn-sm rounded-lg"
              :disabled="!draft.trim() || support.sending"
              @click="send">
              <span v-if="support.sending" class="loading loading-spinner loading-xs" />
              <AppIcon v-else name="send" :size="14" />
              Yuborish
            </button>
          </div>
        </div>
      </div>

      <!-- Bo'sh -->
      <div v-else class="ftw-card hidden items-center justify-center xl:flex">
        <EmptyState
          icon="mail"
          title="Ticketni tanlang"
          text="Chapdagi ro'yxatdan savolni oching va javob yozing." />
      </div>
    </div>
  </div>
</template>
