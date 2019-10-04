import { SwappableRenderTarget } from './swappableRenderTarget';
import { LdrRenderTarget } from './ldrRenderTarget';

export class SwappableLdrRenderTarget implements SwappableRenderTarget {
  private readableTarget: LdrRenderTarget;
  private writableTarget: LdrRenderTarget;
  constructor(gl: WebGL2RenderingContext, readonly width: number, readonly height: number) {
    this.readableTarget = new LdrRenderTarget(gl, width, height);
    this.writableTarget = new LdrRenderTarget(gl, width, height);
  }

  get texture(): WebGLTexture {
    return this.readableTarget.texture;
  }

  get framebuffer(): WebGLFramebuffer {
    return this.writableTarget.framebuffer;
  }

  public swap(): void {
    [this.readableTarget, this.writableTarget] = [this.writableTarget, this.readableTarget];
  }
}