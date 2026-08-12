/// <reference types="vite/client" />

declare const Chart: new (
  context: CanvasRenderingContext2D,
  config: unknown,
) => { destroy(): void; resize(): void };
