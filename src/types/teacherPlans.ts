export type TeacherPlanOption = {
  key: string;
  planCode: string;
  title: string;
  tagline: string;
  monthlyPrice: string;
  monthlyAmount: number | null;
  currency: string | null;
  country: string | null;
  yearlyPrice: string | null;
  bestFor: string;
  features: string[];
  isContactOnly: boolean;
  isCurrentPlan: boolean;
  contactHref: string | null;
  contactLabel: string;
};
