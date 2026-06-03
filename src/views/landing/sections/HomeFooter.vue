<template>
  <footer
    class="home-footer bg-white px-4 pb-10 pt-10 [border-top:1px_solid_#f1f5f9] sm:px-6 lg:px-20 lg:pb-20 lg:pt-20"
  >
    <div
      class="home-footer__columns mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-10 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:py-16"
    >
      <div class="home-footer__brand-col flex flex-col items-start gap-4">
        <RouterLink
          to="/"
          class="home-footer__brand flex items-baseline gap-1.5 text-2xl font-bold uppercase leading-none no-underline"
          :aria-label="t('landing.home.nav.logoAria')"
        >
          <span class="text-[#06b6d4]">zidni</span>
          <span class="text-[#1e3a8a]">Ai</span>
        </RouterLink>
        <p
          class="home-footer__tagline m-0 text-sm font-medium leading-[1.6] text-[#64748b]"
        >
          {{ t('landing.home.footer.tagline') }}
        </p>
        <div class="home-footer__socials flex items-start gap-4 pt-2">
          <a
            v-for="social in socials"
            :key="social.id"
            :href="social.href"
            class="home-footer__social flex h-8 w-8 items-center justify-center rounded-lg bg-[#f8fafc] shadow-[0_1px_1px_rgb(0_0_0_/_0.05)] transition-opacity hover:opacity-70"
            :aria-label="t(social.labelKey)"
          >
            <img
              :src="social.icon"
              alt=""
              class="h-[15px] w-auto shrink-0"
              loading="lazy"
              decoding="async"
            />
          </a>
        </div>
      </div>

      <div
        v-for="column in linkColumns"
        :key="column.id"
        class="home-footer__col flex flex-col gap-6"
      >
        <h6
          class="m-0 text-xs font-semibold uppercase tracking-[1.2px] text-[#1e3a8a]"
        >
          {{ t(column.titleKey) }}
        </h6>
        <ul class="m-0 flex list-none flex-col gap-4 p-0">
          <li v-for="link in column.links" :key="link.labelKey">
            <RouterLink
              v-if="link.to"
              :to="link.to"
              class="home-footer__link text-sm font-medium text-[#64748b] no-underline transition-colors hover:text-sakai-primary"
            >
              {{ t(link.labelKey) }}
            </RouterLink>
            <a
              v-else
              :href="link.href"
              class="home-footer__link text-sm font-medium text-[#64748b] no-underline transition-colors hover:text-sakai-primary"
            >
              {{ t(link.labelKey) }}
            </a>
          </li>
        </ul>
      </div>
    </div>

    <div
      class="home-footer__legal mx-auto w-full max-w-[1280px] px-4 pb-2 pt-8 text-center [border-top:1px_solid_#f8fafc] sm:px-12"
    >
      <p
        class="m-0 text-[10px] font-semibold uppercase leading-[1.5] tracking-[1px] text-[#94a3b8]"
      >
        {{ t('landing.home.footer.copyright', { year: currentYear }) }}
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { landingMessages } from '@/views/landing/messages';
import iconSocialGlobe from '@/assets/landing/icon-social-globe.svg';
import iconSocialShare from '@/assets/landing/icon-social-share.svg';
import iconSocialChat from '@/assets/landing/icon-social-chat.svg';

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: landingMessages,
});

const currentYear = new Date().getFullYear();

// Social destinations are not specified in the design — placeholder hrefs
// (see migration_notes.md).
const socials = [
  {
    id: 'globe',
    icon: iconSocialGlobe,
    href: '#',
    labelKey: 'landing.home.footer.socials.website',
  },
  {
    id: 'share',
    icon: iconSocialShare,
    href: '#',
    labelKey: 'landing.home.footer.socials.share',
  },
  {
    id: 'chat',
    icon: iconSocialChat,
    href: '#',
    labelKey: 'landing.home.footer.socials.chat',
  },
] as const;

interface FooterLink {
  labelKey: string;
  to?: string;
  href?: string;
}

interface FooterColumn {
  id: string;
  titleKey: string;
  links: FooterLink[];
}

// Items without a real destination yet use '#' placeholders — logged in
// migration_notes.md (docs, case studies, community, about, careers).
const linkColumns: FooterColumn[] = [
  {
    id: 'product',
    titleKey: 'landing.home.footer.product.title',
    links: [
      { labelKey: 'landing.home.footer.product.features', href: '#solutions' },
      { labelKey: 'landing.home.footer.product.aiArchitect', href: '#ai' },
      {
        labelKey: 'landing.home.footer.product.integrations',
        href: '#integrations',
      },
      { labelKey: 'landing.home.footer.product.pricing', to: '/pricing' },
    ],
  },
  {
    id: 'resources',
    titleKey: 'landing.home.footer.resources.title',
    links: [
      { labelKey: 'landing.home.footer.resources.documentation', href: '#' },
      { labelKey: 'landing.home.footer.resources.caseStudies', href: '#' },
      { labelKey: 'landing.home.footer.resources.helpCenter', to: '/support' },
      { labelKey: 'landing.home.footer.resources.community', href: '#' },
    ],
  },
  {
    id: 'company',
    titleKey: 'landing.home.footer.company.title',
    links: [
      { labelKey: 'landing.home.footer.company.about', href: '#' },
      { labelKey: 'landing.home.footer.company.careers', href: '#' },
      { labelKey: 'landing.home.footer.company.privacy', to: '/privacy' },
      { labelKey: 'landing.home.footer.company.terms', to: '/terms' },
    ],
  },
];
</script>
