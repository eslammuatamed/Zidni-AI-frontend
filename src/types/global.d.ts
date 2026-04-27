declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'sockjs-client';

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

// make Vitest globals (vi/describe/it/expect) available to TS
declare global {
  const vi: any;
  const describe: any;
  const it: any;
  const expect: any;
  const beforeEach: any;
  const afterEach: any;
}
