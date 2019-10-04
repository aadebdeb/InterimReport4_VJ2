import { RenderTarget } from './renderTarget';
import { createTexture, createSingleColorFramebuffer } from '../utils/webgl';

function createHdr16ColorTexture(gl: WebGL2RenderingContext, width: number, height: number): WebGLTexture {
  return createTexture(gl, width, height, {
    internalFormat: gl.RGBA16F,
    format: gl.RGBA,
    type: gl.HALF_FLOAT,
    parameteri: [
      [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
      [gl.TEXTURE_MIN_FILTER, gl.LINEAR],
      [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE],
      [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]
    ]
  });
}

function createHdr32ColorTexture(gl: WebGL2RenderingContext, width: number, height: number): WebGLTexture {
  return createTexture(gl, width, height, {
    internalFormat: gl.RGBA32F,
    format: gl.RGBA,
    type: gl.FLOAT,
    parameteri: [
      [gl.TEXTURE_MAG_FILTER, gl.NEAREST],
      [gl.TEXTURE_MIN_FILTER, gl.NEAREST],
      [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE],
      [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]
    ]
  });
}


type ConstructorOptions = {
  float?: boolean;
}

export class HdrRenderTarget implements RenderTarget {
  readonly texture: WebGLTexture;
  readonly framebuffer: WebGLFramebuffer;

  constructor(gl: WebGL2RenderingContext, readonly width: number, readonly height: number, {
    float = false,
  }: ConstructorOptions = {}) {
    this.texture = float ? createHdr32ColorTexture(gl, width, height) : createHdr16ColorTexture(gl, width, height);
    this.framebuffer = createSingleColorFramebuffer(gl, this.texture);
  }
}