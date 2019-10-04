import { RenderTarget } from './renderTarget';
import { createTexture } from '../utils/webgl';

function createDepthTexture(gl: WebGL2RenderingContext, width: number, height: number): WebGLTexture {
  return createTexture(gl, width, height, {
    internalFormat: gl.DEPTH_COMPONENT32F,
    format: gl.DEPTH_COMPONENT,
    type: gl.FLOAT,
    parameteri: [
      [gl.TEXTURE_MAG_FILTER, gl.NEAREST],
      [gl.TEXTURE_MIN_FILTER, gl.NEAREST],
      [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE],
      [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]
    ]
  });
}

export class DepthRenderTarget implements RenderTarget {
  readonly framebuffer: WebGLFramebuffer;
  readonly texture: WebGLTexture;
  constructor(gl: WebGL2RenderingContext, readonly width: number, readonly height: number) {
    this.texture = createDepthTexture(gl, width, height);
    this.framebuffer = <WebGLFramebuffer>gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.texture, 0);
    gl.drawBuffers([gl.NONE]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}