import { mount } from '@vue/test-utils';
import QuizListenChoose from '../../components/QuizListenChoose.vue';

const quizItems = [
  {
    vocabId: 'lion',
    englishWord: 'Lion',
    arabicWord: 'أسد',
    imagePath: '/assets/lion.jpg',
    options: [
      { id: 'lion', englishWord: 'Lion', imagePath: '/assets/lion.jpg' },
      { id: 'cat', englishWord: 'Cat', imagePath: '/assets/cat.jpg' },
      { id: 'dog', englishWord: 'Dog', imagePath: '/assets/dog.jpg' },
      { id: 'fox', englishWord: 'Fox', imagePath: '/assets/fox.jpg' }
    ]
  }
];

describe('QuizListenChoose', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('speechSynthesis', {
      speak: vi.fn(),
      cancel: vi.fn()
    });
    vi.stubGlobal('SpeechSynthesisUtterance', function (this: any, text: string) {
      this.text = text;
      this.lang = 'en-US';
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('emits answered and complete events', async () => {
    const wrapper = mount(QuizListenChoose, {
      props: { items: quizItems }
    });

    const buttons = wrapper.findAll('button.quiz__option');
    await buttons[0].trigger('click');

    expect(wrapper.emitted('answered')).toBeTruthy();
    expect(wrapper.emitted('answered')?.[0]?.[0]).toEqual({ vocabId: 'lion', correct: true });

    vi.runAllTimers();

    expect(wrapper.emitted('complete')).toBeTruthy();
  });
});
