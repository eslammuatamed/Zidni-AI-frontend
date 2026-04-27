import { defineStore } from 'pinia';
import type { TeacherPlanOption } from '@/types/teacherPlans';

type PaymentMethodCode = string;

type State = {
  plan: TeacherPlanOption | null;
  paymentMethods: PaymentMethodCode[];
};

const normalizePaymentMethods = (methods: PaymentMethodCode[]): PaymentMethodCode[] =>
  Array.from(
    new Set(
      methods
        .map((code) => (typeof code === 'string' ? code.trim().toUpperCase() : ''))
        .filter((code): code is string => !!code)
    )
  );

export const useTeacherPlanCheckoutStore = defineStore('teacherPlanCheckout', {
  state: (): State => ({
    plan: null,
    paymentMethods: []
  }),
  actions: {
    setCheckout(plan: TeacherPlanOption, methods: PaymentMethodCode[]) {
      this.plan = { ...plan };
      this.paymentMethods = normalizePaymentMethods(methods);
    },
    clear() {
      this.plan = null;
      this.paymentMethods = [];
    }
  }
});
