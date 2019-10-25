import { Filter, FilterOptions } from './filter';
import { FragmentShader } from '../webgl/shader';
import { Program } from '../webgl/program';
import { RenderTarget } from '../renderTargets/renderTarget';
import { setUniformTexture } from '../utils/webgl';
import { createFillViewportProgram } from '../utils/shader';
import glitchFragmentSource from '!!raw-loader!./shaders/glitchFragment';

enum Uniforms {
  SRC_TEXTURE = 'u_srcTexture',
  ELAPSED_SECS = 'u_elapsedSecs',
  SHIFT_X_INTENSITY = 'u_shiftXIntensity',
  SHIFT_Y_INTENSITY = 'u_shiftYIntensity',
  SHIFT_X_RATE = 'u_shiftXRate',
  SHIFT_Y_RATE = 'u_shiftYRate',
}

type ConstructorOptions = {
  shiftXIntensity?: number,
  shiftYIntensity?: number,
  shiftXRate?: number,
  shiftYRate?: number,
}

export class GlitchFilter implements Filter {
  active: boolean = true;
  private program: Program;
  public shiftXIntensity: number;
  public shiftYIntensity: number;
  public shiftXRate: number;
  public shiftYRate: number;
  constructor(gl: WebGL2RenderingContext, {
    shiftXIntensity = 0.0,
    shiftYIntensity = 0.0,
    shiftXRate = 0.0,
    shiftYRate = 0.0,
  }: ConstructorOptions = {}) {
    this.program = createFillViewportProgram(gl,
      new FragmentShader(gl, glitchFragmentSource, new Set(Object.values(Uniforms))));
    this.shiftXIntensity = shiftXIntensity;
    this.shiftYIntensity = shiftYIntensity;
    this.shiftXRate = shiftXRate;
    this.shiftYRate = shiftYRate;
  }

  get effective(): boolean {
    return (this.shiftXIntensity > 0.0 && this.shiftXRate > 0.0)
      || (this.shiftYIntensity > 0.0 && this.shiftYRate > 0.0);
  }

  apply(gl: WebGL2RenderingContext, src: RenderTarget, dst: RenderTarget, options: FilterOptions = {}): void {
    if (options.elapsedSecs === undefined) {
      throw new Error('elapsedSecs needed.');
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.framebuffer);
    gl.viewport(0.0, 0.0, dst.width, dst.height);
    gl.useProgram(this.program.program);
    setUniformTexture(gl, 0, src.texture, this.program.getUniform(Uniforms.SRC_TEXTURE));
    gl.uniform1f(this.program.getUniform(Uniforms.ELAPSED_SECS), options.elapsedSecs);
    gl.uniform1f(this.program.getUniform(Uniforms.SHIFT_X_INTENSITY), this.shiftXIntensity);
    gl.uniform1f(this.program.getUniform(Uniforms.SHIFT_Y_INTENSITY), this.shiftYIntensity);
    gl.uniform1f(this.program.getUniform(Uniforms.SHIFT_X_RATE), this.shiftXRate);
    gl.uniform1f(this.program.getUniform(Uniforms.SHIFT_Y_RATE), this.shiftYRate);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}