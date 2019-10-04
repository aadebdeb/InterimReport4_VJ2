import { RenderTarget } from './renderTarget';

export class CanvasRenderTarget implements RenderTarget {
  constructor(readonly width: number, readonly height: number) {}
  
  get texture(): never {
    throw new Error('do not call this method');
  }

  get framebuffer(): null {
    return null;
  }

}