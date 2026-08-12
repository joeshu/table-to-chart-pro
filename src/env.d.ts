/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

declare const Chart: new (
  context: CanvasRenderingContext2D,
  config: unknown,
) => { destroy(): void; resize(): void };
