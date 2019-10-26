import {Filter, FilterOptions } from './filter';
import { FragmentShader } from '../webgl/shader';
import { Program } from '../webgl/program';
import { RenderTarget } from '../renderTargets/renderTarget';
import { setUniformTexture } from '../utils/webgl';
import { createFillViewportProgram } from '../utils/shader';
import glabbilyFragmentSource from '!!raw-loader!./shaders/flabbilyFragment';

enum Uniforms {
  SRC_TEXTURE = 'u_srcTexture',
  ELAPSED_SECS = 'u_elapsedSecs',
  INTENSITY = 'u_intensity',
}

type ConstructorOptions = {
  intensity?: number,
}

export class FlabbilyFilter implements Filter {
  active: boolean = true;
  private program: Program;
  intensity: number;
  constructor(gl: WebGL2RenderingContext, {
    intensity = 0.0,
  }: ConstructorOptions = {}) {
    this.program = createFillViewportProgram(gl,
      new FragmentShader(gl, glabbilyFragmentSource, new Set(Object.values(Uniforms)))); 
    this.intensity = intensity;
  }

  get effective(): boolean {
    return true;
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
    gl.uniform1f(this.program.getUniform(Uniforms.INTENSITY), this.intensity);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}