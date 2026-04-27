import { mount } from '@vue/test-utils';
import PictureCard from '../../components/PictureCard.vue';

const vocabItem = {
  id: '1',
  category: 'animals',
  englishWord: 'Lion',
  arabicWord: 'أسد',
  imagePath: '/assets/test.jpg',
  audioPath: null
};

describe('PictureCard', () => {
  beforeEach(() => {
    vi.stubGlobal('speechSynthesis', {
      speak: vi.fn(),
      cancel: vi.fn()
    });
    vi.stubGlobal('SpeechSynthesisUtterance', function (this: any, text: string) {
      this.text = text;
      this.lang = 'en-US';
      this.rate = 1;
      this.pitch = 1;
      this.onstart = vi.fn();
      this.onend = vi.fn();
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('emits select when clicked', async () => {
    const wrapper = mount(PictureCard, {
      props: { vocab: vocabItem }
    });

    await wrapper.trigger('click');

    expect(wrapper.emitted('select')).toBeTruthy();
    expect((window as any).speechSynthesis.speak).toHaveBeenCalled();
  });
});
