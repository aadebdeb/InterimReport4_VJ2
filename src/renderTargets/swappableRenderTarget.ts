import { RenderTarget } from './renderTarget';

export interface SwappableRenderTarget extends RenderTarget {
  swap(): void;
}