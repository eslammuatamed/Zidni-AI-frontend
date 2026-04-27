<template>
  <UiCard v-if="page" class="landing-editor">
    <template #title>
      <div class="landing-editor__title">
        <span class="landing-editor__route">/{{ page.route }}</span>
        <span class="landing-editor__version">{{ t('landing.admin.versionLabel', { version: page.version }) }}</span>
      </div>
    </template>
    <template #actions>
      <UiButton
        variant="outline"
        color="secondary"
        :disabled="page.current"
        @click="emitPublish"
      >
        {{ t('landing.admin.publish') }}
      </UiButton>
      <UiButton
        variant="link"
        color="danger"
        :disabled="page.current"
        @click="emitDelete"
      >
        {{ t('common.delete') }}
      </UiButton>
    </template>

    <div class="landing-editor__toggles">
      <UiSwitch v-model="enabled" :label="t('landing.admin.enabled')" />
      <UiButton color="primary" :disabled="saving" @click="emitSave">
        {{ t('common.save') }}
      </UiButton>
    </div>

    <div class="landing-editor__grid">
      <UiTextarea
        v-model="seoText"
        :label="t('landing.admin.seoJson')"
        :rows="8"
      />
      <UiTextarea
        v-model="layoutText"
        :label="t('landing.admin.layoutJson')"
        :rows="8"
      />
    </div>

    <section class="landing-editor__group">
      <header class="landing-editor__group-header">
        <h3>{{ t('landing.admin.sections') }}</h3>
      </header>
      <div class="landing-editor__inline-form">
        <UiSelect v-model="newSection.kind" :label="t('landing.admin.sectionKind')">
          <option v-for="option in sectionKinds" :key="option.value" :value="option.value">
            {{ option.title }}
          </option>
        </UiSelect>
        <UiInput
          v-model.number="newSection.position"
          :label="t('landing.admin.sectionPosition')"
          type="number"
          min="1"
        />
        <UiButton class="landing-editor__inline-action" color="primary" @click="addNewSection">
          {{ t('landing.admin.addSection') }}
        </UiButton>
      </div>
      <div class="landing-editor__accordion">
        <details
          v-for="section in sections"
          :key="section.id || `new-${section.kind}-${section.position}`"
          class="landing-editor__item"
        >
          <summary class="landing-editor__summary">
            <div>
              <span class="landing-editor__item-title">{{ section.kind }}</span>
              <span class="landing-editor__item-subtitle">
                {{ t('landing.admin.positionLabel', { position: section.position }) }}
              </span>
            </div>
            <UiIcon class="landing-editor__summary-icon" name="DownOutlined" :size="16" />
          </summary>
          <div class="landing-editor__item-body">
            <div class="landing-editor__item-grid">
              <UiInput
                v-model.number="section.position"
                :label="t('landing.admin.sectionPosition')"
                type="number"
                min="1"
              />
              <UiTextarea
                v-model="section.dataText"
                :label="t('landing.admin.sectionData')"
                :rows="6"
              />
            </div>
            <div class="landing-editor__item-actions">
              <UiButton variant="outline" color="primary" @click="saveSection(section)">
                {{ t('common.save') }}
              </UiButton>
              <UiButton variant="link" color="danger" @click="removeSection(section)">
                {{ t('common.delete') }}
              </UiButton>
            </div>
          </div>
        </details>
      </div>
    </section>

    <section class="landing-editor__group">
      <header class="landing-editor__group-header">
        <h3>{{ t('landing.admin.assets') }}</h3>
      </header>
      <div class="landing-editor__inline-form landing-editor__inline-form--assets">
        <UiSelect v-model="newAsset.kind" :label="t('landing.admin.assetKind')">
          <option v-for="option in assetKindOptions" :key="option.value" :value="option.value">
            {{ option.title }}
          </option>
        </UiSelect>
        <UiInput v-model="newAsset.url" :label="t('landing.admin.assetUrl')" required />
        <UiInput v-model="newAsset.alt" :label="t('landing.admin.assetAlt')" />
        <UiTextarea
          v-model="newAsset.metadataText"
          :label="t('landing.admin.assetMetadata')"
          :rows="4"
        />
        <UiButton class="landing-editor__inline-action" color="primary" @click="addNewAsset">
          {{ t('landing.admin.addAsset') }}
        </UiButton>
      </div>
      <div class="landing-editor__accordion">
        <details
          v-for="asset in assets"
          :key="asset.id || `asset-${asset.url}`"
          class="landing-editor__item"
        >
          <summary class="landing-editor__summary">
            <div>
              <span class="landing-editor__item-title">{{ asset.kind }} — {{ asset.url }}</span>
              <span class="landing-editor__item-subtitle" v-if="asset.id">ID: {{ asset.id }}</span>
            </div>
            <UiIcon class="landing-editor__summary-icon" name="DownOutlined" :size="16" />
          </summary>
          <div class="landing-editor__item-body">
            <div class="landing-editor__item-grid landing-editor__item-grid--assets">
              <UiSelect v-model="asset.kind" :label="t('landing.admin.assetKind')">
                <option v-for="option in assetKindOptions" :key="option.value" :value="option.value">
                  {{ option.title }}
                </option>
              </UiSelect>
              <UiInput v-model="asset.url" :label="t('landing.admin.assetUrl')" />
              <UiInput v-model="asset.alt" :label="t('landing.admin.assetAlt')" />
              <UiTextarea
                v-model="asset.metadataText"
                :label="t('landing.admin.assetMetadata')"
                :rows="4"
              />
            </div>
            <div class="landing-editor__item-actions">
              <UiButton variant="outline" color="primary" @click="saveAsset(asset)">
                {{ t('common.save') }}
              </UiButton>
              <UiButton variant="link" color="danger" @click="removeAsset(asset)">
                {{ t('common.delete') }}
              </UiButton>
            </div>
          </div>
        </details>
      </div>
    </section>
  </UiCard>
  <UiAlert v-else variant="soft" color="info" class="landing-editor__empty">
    {{ t('landing.admin.selectPrompt') }}
  </UiAlert>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSwitch from '@/components/ui/UiSwitch.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import type { LandingAsset, LandingPageDetail, LandingSection } from '@/services/landing';

const props = defineProps<{
  page: LandingPageDetail | null;
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: 'update', payload: { enabled: boolean; seo: Record<string, unknown>; layout: Record<string, unknown> }): void;
  (e: 'add-section', payload: { kind: string; position?: number }): void;
  (e: 'update-section', section: LandingSection, payload: { data: Record<string, unknown>; position: number }): void;
  (e: 'delete-section', section: LandingSection): void;
  (e: 'add-asset', payload: { kind: string; url: string; alt?: string; metadata?: Record<string, unknown> }): void;
  (e: 'update-asset', asset: LandingAsset, payload: { kind?: string; url?: string; alt?: string; metadata?: Record<string, unknown> }): void;
  (e: 'delete-asset', asset: LandingAsset): void;
  (e: 'publish'): void;
  (e: 'delete'): void;
}>();

const { t } = useI18n();

const enabled = ref(false);
const seoText = ref('{}');
const layoutText = ref('{}');
const sections = ref<Array<LandingSection & { dataText: string }>>([]);
const assets = ref<Array<LandingAsset & { metadataText: string }>>([]);

const sectionKinds = [
  { title: 'Hero', value: 'hero' },
  { title: 'Courses', value: 'courses' },
  { title: 'Features', value: 'features' },
  { title: 'Offers', value: 'offers' },
  { title: 'Testimonials', value: 'testimonials' },
  { title: 'FAQ', value: 'faq' },
  { title: 'CTA', value: 'cta' },
  { title: 'Custom', value: 'custom' }
];

const newSection = reactive<{ kind: string; position: number | null }>({ kind: 'hero', position: null });
const newAsset = reactive<{ kind: string; url: string; alt?: string; metadataText: string }>({
  kind: 'image',
  url: '',
  alt: '',
  metadataText: '{}'
});

const assetKindOptions = computed(() => [
  { title: t('landing.admin.assetKindImage'), value: 'image' },
  { title: t('landing.admin.assetKindVideo'), value: 'video' },
  { title: t('landing.admin.assetKindFile'), value: 'file' }
]);

watch(
  () => props.page,
  (page) => {
    if (!page) {
      sections.value = [];
      assets.value = [];
      return;
    }
    enabled.value = page.enabled;
    seoText.value = JSON.stringify(page.seo || {}, null, 2);
    layoutText.value = JSON.stringify(page.layout || {}, null, 2);
    sections.value = page.sections.map((section) => ({ ...section, dataText: JSON.stringify(section.data || {}, null, 2) }));
    assets.value = page.assets.map((asset) => ({
      ...asset,
      metadataText: JSON.stringify(asset.metadata || {}, null, 2)
    }));
  },
  { immediate: true }
);

const parseJson = (text: string) => {
  try {
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.warn('Invalid JSON', error);
    return {};
  }
};

const emitSave = () => {
  if (!props.page) return;
  emit('update', {
    enabled: enabled.value,
    seo: parseJson(seoText.value),
    layout: parseJson(layoutText.value)
  });
};

const addNewSection = () => {
  if (!props.page || !newSection.kind) return;
  emit('add-section', {
    kind: newSection.kind,
    position: newSection.position ?? undefined
  });
  newSection.position = null;
};

const saveSection = (section: LandingSection & { dataText: string }) => {
  if (!props.page) return;
  emit('update-section', section, {
    data: parseJson(section.dataText),
    position: section.position
  });
};

const removeSection = (section: LandingSection) => {
  if (!props.page || !section.id) return;
  emit('delete-section', section);
};

const addNewAsset = () => {
  if (!props.page || !newAsset.url) return;
  emit('add-asset', {
    kind: newAsset.kind,
    url: newAsset.url,
    alt: newAsset.alt || undefined,
    metadata: parseJson(newAsset.metadataText)
  });
  newAsset.url = '';
  newAsset.alt = '';
  newAsset.metadataText = '{}';
};

const saveAsset = (asset: LandingAsset & { metadataText: string }) => {
  if (!props.page || !asset.id) return;
  emit('update-asset', asset, {
    kind: asset.kind,
    url: asset.url,
    alt: asset.alt,
    metadata: parseJson(asset.metadataText)
  });
};

const removeAsset = (asset: LandingAsset) => {
  if (!props.page || !asset.id) return;
  emit('delete-asset', asset);
};

const emitPublish = () => emit('publish');
const emitDelete = () => emit('delete');
</script>

<style scoped>
.landing-editor {
  gap: var(--sakai-space-6);
}

.landing-editor__title {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.landing-editor__route {
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.landing-editor__version {
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.landing-editor__toggles {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-4);
}

.landing-editor__grid {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.landing-editor__group {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.landing-editor__group-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.landing-editor__inline-form {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  align-items: end;
}

.landing-editor__inline-form--assets {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.landing-editor__inline-action {
  justify-self: start;
}

.landing-editor__accordion {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.landing-editor__item {
  background: var(--sakai-surface);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
  border-radius: var(--sakai-border-radius-lg);
  padding: var(--sakai-space-3) var(--sakai-space-4);
}

.landing-editor__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-3);
  cursor: pointer;
  list-style: none;
}

.landing-editor__summary::-webkit-details-marker {
  display: none;
}

.landing-editor__summary-icon {
  color: var(--sakai-text-color-tertiary);
  transition: transform var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.landing-editor__item[open] .landing-editor__summary-icon {
  transform: rotate(180deg);
}

.landing-editor__item-title {
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color);
}

.landing-editor__item-subtitle {
  display: block;
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.landing-editor__item-body {
  margin-top: var(--sakai-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.landing-editor__item-grid {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: minmax(160px, 1fr);
}

.landing-editor__item-grid--assets {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.landing-editor__item-actions {
  display: flex;
  gap: var(--sakai-space-3);
  justify-content: flex-end;
}

.landing-editor__empty {
  justify-content: center;
}

@media (max-width: 768px) {
  .landing-editor__toggles {
    flex-direction: column;
    align-items: flex-start;
  }

  .landing-editor__item-actions {
    justify-content: flex-start;
  }
}
</style>
