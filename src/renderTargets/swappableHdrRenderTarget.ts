import { SwappableRenderTarget } from './swappableRenderTarget';
import { HdrRenderTarget } from './hdrRenderTarget';

type ConstrurOptions = {
  float?: boolean,
}

export class SwappableHdrRenderTarget implements SwappableRenderTarget {
  private readableTarget: HdrRenderTarget;
  private writableTarget: HdrRenderTarget;
  constructor(gl: WebGL2RenderingContext, readonly width: number, readonly height: number, options?: ConstrurOptions) {
    this.readableTarget = new HdrRenderTarget(gl, width, height, options);
    this.writableTarget = new HdrRenderTarget(gl, width, height, options);
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