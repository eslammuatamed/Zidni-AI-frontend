import { readonly, ref } from 'vue';

type ToastSeverity = 'info' | 'success' | 'warning' | 'danger';

interface ToastOptions {
  severity?: ToastSeverity;
  summary?: string;
  detail?: string;
  closable?: boolean;
  life?: number;
}

interface ToastMessage extends Required<Omit<ToastOptions, 'life' | 'closable' | 'severity'>> {
  id: number;
  severity: ToastSeverity;
  closable: boolean;
  life: number;
}

type ToastInput = string | ToastOptions;

type TimeoutHandle = ReturnType<typeof setTimeout>;

const DEFAULT_LIFE = 4000;

const messages = ref<ToastMessage[]>([]);
const timers = new Map<number, TimeoutHandle>();
let seed = 0;

const toToastMessage = (input: ToastInput, fallbackSeverity: ToastSeverity = 'info'): ToastOptions => {
  if (typeof input === 'string') {
    return { detail: input, severity: fallbackSeverity };
  }
  return { severity: fallbackSeverity, ...input };
};

const addToast = (options: ToastOptions) => {
  const id = ++seed;
  const severity = options.severity ?? 'info';
  const message: ToastMessage = {
    id,
    severity,
    summary: options.summary ?? '',
    detail: options.detail ?? '',
    closable: options.closable ?? true,
    life: options.life ?? DEFAULT_LIFE
  };

  messages.value = [...messages.value, message];

  if (message.life > 0) {
    const timeout = setTimeout(() => {
      remove(id);
    }, message.life);
    timers.set(id, timeout);
  }

  return id;
};

const show = (input: ToastInput | ToastInput[]) => {
  const payloads = Array.isArray(input) ? input : [input];
  payloads.forEach((payload) => addToast(toToastMessage(payload)));
};

const success = (input: ToastInput | ToastInput[]) => {
  const payloads = Array.isArray(input) ? input : [input];
  payloads.forEach((payload) => addToast(toToastMessage(payload, 'success')));
};

const info = (input: ToastInput | ToastInput[]) => {
  const payloads = Array.isArray(input) ? input : [input];
  payloads.forEach((payload) => addToast(toToastMessage(payload, 'info')));
};

const warning = (input: ToastInput | ToastInput[]) => {
  const payloads = Array.isArray(input) ? input : [input];
  payloads.forEach((payload) => addToast(toToastMessage(payload, 'warning')));
};

const error = (input: ToastInput | ToastInput[]) => {
  const payloads = Array.isArray(input) ? input : [input];
  payloads.forEach((payload) => addToast(toToastMessage(payload, 'danger')));
};

const remove = (id: number) => {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  messages.value = messages.value.filter((toast) => toast.id !== id);
};

const clear = () => {
  timers.forEach((timeout) => clearTimeout(timeout));
  timers.clear();
  messages.value = [];
};

export const useToast = () => ({
  show,
  success,
  info,
  warning,
  error,
  remove,
  clear,
  messages: readonly(messages)
});

export type { ToastMessage, ToastSeverity, ToastOptions };
