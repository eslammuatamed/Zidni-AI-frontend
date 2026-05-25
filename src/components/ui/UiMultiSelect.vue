<template>
  <label class="flex flex-col gap-[0.375rem]">
    <span
      v-if="label"
      class="ms-0.5 text-sm font-semibold text-content"
    >{{ label }}</span>

    <span ref="rootRef" class="relative block">
      <button
        type="button"
        class="flex min-h-[2.875rem] w-full items-center gap-2 rounded-sakai-lg bg-surface-card px-3 py-1.5 text-start shadow-sakai-sm transition-colors [border:1px_solid_var(--sakai-border-color)] hover:[border-color:var(--sakai-primary-400)] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:[border-color:var(--sakai-primary)] focus-visible:[box-shadow:0_0_0_4px_color-mix(in_srgb,var(--sakai-primary)_12%,transparent)]"
        :disabled="disabled"
        aria-haspopup="listbox"
        :aria-expanded="open"
        @click="toggle"
      >
        <span class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <template v-if="selectedOptions.length">
            <span
              v-for="opt in visibleChips"
              :key="opt.value"
              class="inline-flex items-center gap-1 rounded-sakai-md bg-[var(--sakai-primary-tint-12)] py-0.5 pe-1 ps-2 text-[0.8125rem] text-sakai-primary"
            >
              {{ opt.label }}
              <span
                role="button"
                tabindex="-1"
                class="inline-flex cursor-pointer items-center rounded-sm p-0.5 hover:bg-[color-mix(in_srgb,var(--sakai-primary)_18%,transparent)]"
                :aria-label="removeLabel"
                @click.stop="remove(opt.value)"
              >
                <UiIcon name="CloseOutlined" :size="12" />
              </span>
            </span>
            <span v-if="hiddenCount > 0" class="text-[0.8125rem] text-content-tertiary">
              +{{ hiddenCount }}
            </span>
          </template>
          <span v-else class="text-content-tertiary">{{ placeholder }}</span>
        </span>

        <UiIcon
          v-if="loading"
          name="ReloadOutlined"
          :size="16"
          class="shrink-0 animate-spin text-content-tertiary"
        />
        <UiIcon
          v-else
          name="DownOutlined"
          :size="16"
          class="shrink-0 text-content-tertiary transition-transform"
          :class="{ '-rotate-180': open }"
        />
      </button>

      <Teleport to="body">
        <div
          v-if="open"
          ref="panelRef"
          role="listbox"
          aria-multiselectable="true"
          :aria-label="label"
          :style="panelStyle"
          class="fixed z-[2000] max-h-[16rem] overflow-y-auto rounded-sakai-lg bg-surface-card p-1.5 shadow-[var(--sakai-shadow-lg)] [border:1px_solid_var(--sakai-border-color)]"
          @keydown="onPanelKeydown"
        >
          <div v-if="loading" class="px-3 py-2 text-sm text-content-tertiary">{{ loadingText }}</div>
          <div v-else-if="!options.length" class="px-3 py-2 text-sm text-content-tertiary">{{ emptyText }}</div>
          <template v-else>
            <button
              v-for="opt in options"
              :key="opt.value"
              type="button"
              role="option"
              :aria-selected="isSelected(opt.value)"
              :disabled="opt.disabled"
              class="flex w-full cursor-pointer items-center gap-2.5 rounded-md bg-transparent px-3 py-2 text-start text-sm text-content disabled:cursor-not-allowed disabled:opacity-60 hover:bg-[color-mix(in_srgb,var(--sakai-primary)_8%,transparent)]"
              @click="toggleOption(opt)"
            >
              <span
                class="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px]"
                :class="
                  isSelected(opt.value)
                    ? 'bg-sakai-primary text-white'
                    : '[border:1px_solid_var(--sakai-border-color)]'
                "
              >
                <UiIcon v-if="isSelected(opt.value)" name="CheckCircleOutlined" :size="12" />
              </span>
              <span class="min-w-0 flex-1 truncate">{{ opt.label }}</span>
            </button>
          </template>
        </div>
      </Teleport>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import UiIcon from "@/components/ui/UiIcon.vue";

export interface UiMultiSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    modelValue: (string | number)[];
    options: UiMultiSelectOption[];
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    loading?: boolean;
    /** Collapse chips beyond this count into a "+N" indicator. */
    maxChips?: number;
    loadingText?: string;
    emptyText?: string;
    removeLabel?: string;
  }>(),
  {
    label: "",
    placeholder: "Select…",
    disabled: false,
    loading: false,
    maxChips: undefined,
    loadingText: "Loading…",
    emptyText: "No options",
    removeLabel: "Remove",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: (string | number)[]): void;
}>();

const rootRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const open = ref(false);
const panelStyle = ref<Record<string, string>>({});

const optionMap = computed(
  () => new Map(props.options.map((opt) => [opt.value, opt])),
);

// Chips follow the modelValue order; unknown values fall back to their raw value.
const selectedOptions = computed<UiMultiSelectOption[]>(() =>
  props.modelValue.map(
    (value) => optionMap.value.get(value) ?? { value, label: String(value) },
  ),
);

const visibleChips = computed(() =>
  props.maxChips != null
    ? selectedOptions.value.slice(0, props.maxChips)
    : selectedOptions.value,
);
const hiddenCount = computed(() =>
  props.maxChips != null
    ? Math.max(0, selectedOptions.value.length - props.maxChips)
    : 0,
);

function isSelected(value: string | number) {
  return props.modelValue.includes(value);
}

function toggleOption(opt: UiMultiSelectOption) {
  if (opt.disabled) return;
  const next = isSelected(opt.value)
    ? props.modelValue.filter((v) => v !== opt.value)
    : [...props.modelValue, opt.value];
  emit("update:modelValue", next);
}

function remove(value: string | number) {
  emit(
    "update:modelValue",
    props.modelValue.filter((v) => v !== value),
  );
}

function panelItems(): HTMLButtonElement[] {
  return Array.from(panelRef.value?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);
}

function updatePosition() {
  const trigger = rootRef.value?.querySelector("button");
  if (!trigger) return;
  const rect = trigger.getBoundingClientRect();
  const rtl = getComputedStyle(trigger).direction === "rtl";
  const top = `${rect.bottom + 4}px`;
  const minWidth = `${rect.width}px`;
  // Anchor to the field's reading-start edge so the panel mirrors the trigger.
  panelStyle.value = rtl
    ? { top, right: `${window.innerWidth - rect.right}px`, minWidth }
    : { top, left: `${rect.left}px`, minWidth };
}

function openMenu() {
  if (props.disabled) return;
  updatePosition();
  open.value = true;
  nextTick(() => {
    panelItems()[0]?.focus();
    document.addEventListener("click", onDocClick, true);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
  });
}

function close() {
  if (!open.value) return;
  open.value = false;
  removeListeners();
  (rootRef.value?.querySelector("button") as HTMLButtonElement | null)?.focus();
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
  const list = panelItems();
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
