import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/services/ai', () => ({
  generateLessonSummary: vi.fn().mockResolvedValue({
    summary: 'Generated summary',
    keyTakeaways: []
  }),
  exportLessonSummaryPdf: vi.fn().mockResolvedValue(new Blob()),
  rewriteLesson: vi.fn().mockResolvedValue({
    rewrittenContent: 'Rewritten lesson',
    language: 'en',
    tone: 'Friendly'
  }),
  adaptLesson: vi.fn().mockResolvedValue({
    adaptedContent: 'Adapted lesson',
    readingLevel: 'B1',
    language: 'en'
  })
}));

import TeacherLessonAiAssistant from '../TeacherLessonAiAssistant.vue';
import { useFeaturesStore, FEATURE } from '@/stores/features';
import i18n from '@/plugins/i18n';
import { generateLessonSummary, rewriteLesson, adaptLesson, exportLessonSummaryPdf } from '@/services/ai';

const UiTabsStub = defineComponent({
  name: 'UiTabs',
  props: {
    tabs: {
      type: Array,
      default: () => []
    },
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  template: `
    <div class="ui-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="ui-tabs__item"
        @click="$emit('update:modelValue', tab.value)"
      >
        {{ tab.value }}
      </button>
    </div>
  `
});

const VModelStub = defineComponent({
  name: 'VModelStub',
  props: {
    modelValue: {
      type: [String, Number, Boolean, Object, Array],
      default: ''
    }
  },
  emits: ['update:modelValue'],
  template: '<div><slot /></div>'
});

const SimpleStub = defineComponent({
  name: 'SimpleStub',
  template: '<div><slot /></div>'
});

const UiButtonStub = defineComponent({
  name: 'UiButton',
  emits: ['click'],
  template: `
    <button type="button" @click="$emit('click')">
      <slot />
    </button>
  `
});

const mountAssistant = async (flags: {
  summarizer?: boolean;
  rewriter?: boolean;
  adapter?: boolean;
}) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const features = useFeaturesStore();
  features.loaded = true;
  features.audience = 'secure';
  features.features = {};
  features.features[FEATURE.teacherSummarizer] = Boolean(flags.summarizer);
  features.features[FEATURE.teacherRewriter] = Boolean(flags.rewriter);
  features.features[FEATURE.teacherLevelAdapter] = Boolean(flags.adapter);

  const wrapper = mount(TeacherLessonAiAssistant, {
    props: {
      lessonId: 42,
      lessonTitle: 'Sample lesson',
      lessonContent: 'Lesson content'
    },
    global: {
      plugins: [pinia, i18n],
      stubs: {
        UiTabs: UiTabsStub,
        UiInput: VModelStub,
        UiTextarea: VModelStub,
        UiCheckbox: VModelStub,
        UiButton: UiButtonStub,
        UiAlert: SimpleStub,
        UiTag: SimpleStub
      }
    }
  });

  await nextTick();

  return wrapper;
};

type AssistantWrapper = Awaited<ReturnType<typeof mountAssistant>>;

const extractTabValues = (wrapper: AssistantWrapper) => {
  const tabsComponent = wrapper.findComponent(UiTabsStub);
  if (!tabsComponent.exists()) {
    return [] as string[];
  }
  const tabs = tabsComponent.props('tabs') as Array<{ value: string }>;
  return tabs.map((tab) => tab.value);
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('TeacherLessonAiAssistant feature gating', () => {
  it.each([
    ['summary', { summarizer: true }],
    ['rewrite', { rewriter: true }],
    ['adapt', { adapter: true }]
  ])('renders only the %s tab when its feature is enabled alone', async (tabValue, flags) => {
    const wrapper = await mountAssistant(flags);
    const tabValues = extractTabValues(wrapper);
    expect(tabValues).toEqual([tabValue]);
  });

  it.each([
    ['summary', { rewriter: true, adapter: true }],
    ['rewrite', { summarizer: true, adapter: true }],
    ['adapt', { summarizer: true, rewriter: true }]
  ])('omits the %s tab when its feature flag is disabled', async (missingTab, flags) => {
    const wrapper = await mountAssistant(flags);
    const tabValues = extractTabValues(wrapper);
    expect(tabValues).not.toContain(missingTab);
  });
});

describe('TeacherLessonAiAssistant request guards', () => {
  it('prevents summary generation when the summarizer feature is disabled', async () => {
    const wrapper = await mountAssistant({ summarizer: false, rewriter: true, adapter: true });
    const vm = wrapper.vm as unknown as {
      runSummary: () => Promise<void>;
      summaryError: string | { value: string };
    };

    await vm.runSummary();

    expect(generateLessonSummary).not.toHaveBeenCalled();
    const summaryError = typeof vm.summaryError === 'string' ? vm.summaryError : vm.summaryError?.value;
    expect(summaryError).toBe(i18n.global.t('ai.common.forbidden'));
  });

  it('invokes summary generation when the feature is enabled', async () => {
    const wrapper = await mountAssistant({ summarizer: true, rewriter: true, adapter: true });
    const vm = wrapper.vm as unknown as {
      runSummary: () => Promise<void>;
    };

    await vm.runSummary();

    expect(generateLessonSummary).toHaveBeenCalledWith(42, expect.objectContaining({
      lessonTitle: expect.any(String)
    }));
  });

  it('exports a generated summary without invoking the AI again', async () => {
    const wrapper = await mountAssistant({ summarizer: true, rewriter: true, adapter: true });
    const vm = wrapper.vm as unknown as {
      runSummary: () => Promise<void>;
      downloadSummaryPdf: () => Promise<void>;
    };

    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    (URL as unknown as { createObjectURL: (input: Blob | MediaSource) => string }).createObjectURL = vi
      .fn(() => 'blob:mock');
    (URL as unknown as { revokeObjectURL: (url: string) => void }).revokeObjectURL = vi.fn();

    await vm.runSummary();
    await vm.downloadSummaryPdf();

    expect(exportLessonSummaryPdf).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        lessonTitle: expect.any(String),
        summary: 'Generated summary',
        keyTakeaways: expect.any(Array)
      })
    );

    (URL as unknown as { createObjectURL: typeof URL.createObjectURL }).createObjectURL = originalCreate;
    (URL as unknown as { revokeObjectURL: typeof URL.revokeObjectURL }).revokeObjectURL = originalRevoke;
  });

  it('prevents rewrite generation when the rewriter feature is disabled', async () => {
    const wrapper = await mountAssistant({ summarizer: true, rewriter: false, adapter: true });
    const vm = wrapper.vm as unknown as {
      runRewrite: () => Promise<void>;
      rewriteError: string | { value: string };
    };

    await vm.runRewrite();

    expect(rewriteLesson).not.toHaveBeenCalled();
    const rewriteError = typeof vm.rewriteError === 'string' ? vm.rewriteError : vm.rewriteError?.value;
    expect(rewriteError).toBe(i18n.global.t('ai.common.forbidden'));
  });

  it('invokes rewrite generation when the feature is enabled', async () => {
    const wrapper = await mountAssistant({ summarizer: true, rewriter: true, adapter: true });
    const vm = wrapper.vm as unknown as {
      runRewrite: () => Promise<void>;
    };

    await vm.runRewrite();

    expect(rewriteLesson).toHaveBeenCalledWith(42, expect.objectContaining({
      lessonTitle: expect.any(String)
    }));
  });

  it('prevents adaptation generation when the adapter feature is disabled', async () => {
    const wrapper = await mountAssistant({ summarizer: true, rewriter: true, adapter: false });
    const vm = wrapper.vm as unknown as {
      runAdaptation: () => Promise<void>;
      adaptationError: string | { value: string };
    };

    await vm.runAdaptation();

    expect(adaptLesson).not.toHaveBeenCalled();
    const adaptationError =
      typeof vm.adaptationError === 'string' ? vm.adaptationError : vm.adaptationError?.value;
    expect(adaptationError).toBe(i18n.global.t('ai.common.forbidden'));
  });

  it('invokes adaptation generation when the feature is enabled', async () => {
    const wrapper = await mountAssistant({ summarizer: true, rewriter: true, adapter: true });
    const vm = wrapper.vm as unknown as {
      runAdaptation: () => Promise<void>;
      adaptationForm: { targetLevel: string };
    };

    vm.adaptationForm.targetLevel = 'B1';
    await vm.runAdaptation();

    expect(adaptLesson).toHaveBeenCalledWith(42, expect.objectContaining({
      targetLevel: 'B1'
    }));
  });
});
