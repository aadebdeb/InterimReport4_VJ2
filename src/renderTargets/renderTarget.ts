export interface RenderTarget {
  readonly framebuffer: WebGLFramebuffer | null;
  readonly texture: WebGLTexture;
  readonly width: number;
  readonly height: number;
}