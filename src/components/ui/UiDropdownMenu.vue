<template>
  <span ref="rootRef" class="ui-dropdown-menu inline-flex">
    <UiButton
      size="sm"
      variant="link"
      color="neutral"
      prepend-icon="EllipsisOutlined"
      :aria-label="triggerAriaLabel"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="toggle"
    />
    <Teleport to="body">
      <div
        v-if="open"
        ref="panelRef"
        role="menu"
        :style="panelStyle"
        :aria-label="triggerAriaLabel"
        class="fixed z-[2000] min-w-[11rem] rounded-sakai-lg bg-surface-card p-1.5 shadow-[var(--sakai-shadow-lg)] [border:1px_solid_var(--sakai-border-color)] [&_button]:flex [&_button]:w-full [&_button]:cursor-pointer [&_button]:items-center [&_button]:gap-2 [&_button]:rounded-md [&_button]:bg-transparent [&_button]:px-3 [&_button]:py-2 [&_button]:text-start [&_button]:text-sm [&_button]:text-[color:var(--sakai-text-color)] [&_button:hover]:bg-[color-mix(in_srgb,var(--sakai-primary)_8%,transparent)]"
        @keydown="onPanelKeydown"
      >
        <slot :close="close" />
      </div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from "vue";
import UiButton from "@/components/ui/UiButton.vue";

withDefaults(
  defineProps<{
    triggerAriaLabel?: string;
  }>(),
  {
    triggerAriaLabel: "More",
  },
);

const rootRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const open = ref(false);
const panelStyle = ref<Record<string, string>>({});

function triggerButton(): HTMLButtonElement | null {
  return rootRef.value?.querySelector("button") ?? null;
}

function items(): HTMLButtonElement[] {
  return Array.from(panelRef.value?.querySelectorAll<HTMLButtonElement>("button") ?? []);
}

// Position the teleported panel below the trigger, aligned to the reading-end
// edge (right in LTR, left in RTL) — uses physical anchors derived from the
// resolved direction so it flips correctly without measuring the panel width.
function updatePosition() {
  const trigger = triggerButton();
  if (!trigger) return;
  const rect = trigger.getBoundingClientRect();
  const rtl = getComputedStyle(trigger).direction === "rtl";
  const top = `${rect.bottom + 4}px`;
  panelStyle.value = rtl
    ? { top, left: `${rect.left}px` }
    : { top, right: `${window.innerWidth - rect.right}px` };
}

function openMenu() {
  updatePosition();
  open.value = true;
  nextTick(() => {
    items()[0]?.focus();
    document.addEventListener("click", onDocClick, true);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
  });
}

function close() {
  if (!open.value) return;
  open.value = false;
  removeListeners();
  triggerButton()?.focus();
}

function toggle() {
  if (open.value) close();
  else openMenu();
}

function removeListeners() {
  document.removeEventListener("click", onDocClick, true);
  window.removeEventListener("scroll", close, true);
  window.removeEventListener("resize", close);
}

function onDocClick(event: MouseEvent) {
  const target = event.target as Node;
  if (rootRef.value?.contains(target)) return;
  if (panelRef.value?.contains(target)) return;
  close();
}

function onPanelKeydown(event: KeyboardEvent) {
  const list = items();
  if (!list.length) return;
  const index = list.indexOf(document.activeElement as HTMLButtonElement);
  switch (event.key) {
    case "Escape":
      event.preventDefault();
      close();
      break;
    case "ArrowDown":
      event.preventDefault();
      list[(index + 1) % list.length]?.focus();
      break;
    case "ArrowUp":
      event.preventDefault();
      list[(index - 1 + list.length) % list.length]?.focus();
      break;
    case "Home":
      event.preventDefault();
      list[0]?.focus();
      break;
    case "End":
      event.preventDefault();
      list[list.length - 1]?.focus();
      break;
    case "Tab": {
      // Trap focus within the menu.
      event.preventDefault();
      const dir = event.shiftKey ? -1 : 1;
      list[(index + dir + list.length) % list.length]?.focus();
      break;
    }
    default:
      break;
  }
}

onBeforeUnmount(removeListeners);
</script>
