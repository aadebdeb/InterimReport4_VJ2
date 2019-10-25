import { Filter } from './filter';
import { BlurApplier } from './blurApplier';
import { FragmentShader } from '../webgl/shader';
import { Program } from '../webgl/program';
import { RenderTarget } from '../renderTargets/renderTarget';
import { HdrRenderTarget } from '../renderTargets/hdrRenderTarget';
import { LdrRenderTarget } from '../renderTargets/ldrRenderTarget';
import { createFillViewportProgram } from '../utils/shader';
import extractLuminanceFragmentSource from '!!raw-loader!./shaders/extractLuminanceFragment';
import bloomFragmentSource from '!!raw-loader!./shaders/bloomFragment';
import { setUniformTexture } from '../utils/webgl';

enum ExtractLuminanceUniforms {
  SRC_TEXTURE = 'u_srcTexture',
  THRESHOLD = 'u_threshold',
  INTENSITY = 'u_intensity',
}

enum BloomUniforms {
  SRC_TEXTURE = 'u_srcTexture',
  BLUR_TEXTURE0 = 'u_blurTexture0',
  BLUR_TEXTURE1 = 'u_blurTexture1',
  BLUR_TEXTURE2 = 'u_blurTexture2',
  BLUR_TEXTURE3 = 'u_blurTexture3',
}

type ConstructorOptions = {
  threshold?: number;
  intensity?: number;
  hdr?: boolean;
}

export class BloomFilter implements Filter {
  active: boolean = true;
  public threshold: number;
  public intensity: number;
  private extractLuminanceProgram: Program;
  private bloomProgram: Program;
  private luminanceRenderTarget: RenderTarget;
  private blurApplier0: BlurApplier;
  private blurApplier1: BlurApplier;
  private blurApplier2: BlurApplier;
  private blurApplier3: BlurApplier;

  constructor(gl: WebGL2RenderingContext, width: number, height: number, {
    threshold = 1.0,
    intensity = 0.1,
    hdr = false,
  }: ConstructorOptions = {}) {
    this.threshold = threshold;
    this.intensity = intensity;
    this.extractLuminanceProgram = createFillViewportProgram(gl,
      new FragmentShader(gl, extractLuminanceFragmentSource, new Set(Object.values(ExtractLuminanceUniforms))));
    this.bloomProgram = createFillViewportProgram(gl,
      new FragmentShader(gl, bloomFragmentSource, new Set(Object.values(BloomUniforms))));
    this.luminanceRenderTarget = hdr ? new HdrRenderTarget(gl, width, height) : new LdrRenderTarget(gl, width, height);
    this.blurApplier0 = new BlurApplier(gl, width / 4.0, height / 4.0, {hdr: true});
    this.blurApplier1 = new BlurApplier(gl, width / 8.0, height / 8.0, {hdr: true});
    this.blurApplier2 = new BlurApplier(gl, width / 16.0, height / 16.0, {hdr: true});
    this.blurApplier3 = new BlurApplier(gl, width / 32.0, height / 32.0, {hdr: true});
  }

  get effective(): boolean {
    return this.intensity > 0.0;
  }

  apply(gl: WebGL2RenderingContext, src: RenderTarget, dst: RenderTarget): void {
    this.extractLuminance(gl, src);
    const blurTexture0 = this.blurApplier0.apply(gl, this.luminanceRenderTarget);
    const blurTexture1 = this.blurApplier1.apply(gl, this.luminanceRenderTarget);
    const blurTexture2 = this.blurApplier2.apply(gl, this.luminanceRenderTarget);
    const blurTexture3 = this.blurApplier3.apply(gl, this.luminanceRenderTarget);

    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.framebuffer);
    gl.viewport(0.0, 0.0, dst.width, dst.height);
    gl.useProgram(this.bloomProgram.program);
    setUniformTexture(gl, 0, src.texture, this.bloomProgram.getUniform(BloomUniforms.SRC_TEXTURE));
    setUniformTexture(gl, 1, blurTexture0, this.bloomProgram.getUniform(BloomUniforms.BLUR_TEXTURE0));
    setUniformTexture(gl, 2, blurTexture1, this.bloomProgram.getUniform(BloomUniforms.BLUR_TEXTURE1));
    setUniformTexture(gl, 3, blurTexture2, this.bloomProgram.getUniform(BloomUniforms.BLUR_TEXTURE2));
    setUniformTexture(gl, 4, blurTexture3, this.bloomProgram.getUniform(BloomUniforms.BLUR_TEXTURE3));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private extractLuminance(gl: WebGL2RenderingContext, src: RenderTarget): void {
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.luminanceRenderTarget.framebuffer);
    gl.viewport(0.0, 0.0, this.luminanceRenderTarget.width, this.luminanceRenderTarget.height);
    gl.useProgram(this.extractLuminanceProgram.program);
    setUniformTexture(gl, 0, src.texture, this.extractLuminanceProgram.getUniform(ExtractLuminanceUniforms.SRC_TEXTURE));
    gl.uniform1f(this.extractLuminanceProgram.getUniform(ExtractLuminanceUniforms.THRESHOLD), this.threshold);
    gl.uniform1f(this.extractLuminanceProgram.getUniform(ExtractLuminanceUniforms.INTENSITY), this.intensity);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}