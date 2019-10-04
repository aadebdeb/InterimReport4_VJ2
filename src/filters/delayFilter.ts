import { Filter } from './filter';
import { CopyFilter } from './copyFilter';
import { FragmentShader } from '../webgl/shader';
import { Program } from '../webgl/program';
import { RenderTarget } from '../renderTargets/renderTarget';
import { SwappableRenderTarget } from '../renderTargets/swappableRenderTarget';
import { SwappableHdrRenderTarget } from '../renderTargets/swappableHdrRenderTarget';
import { SwappableLdrRenderTarget } from '../renderTargets/swappableLdrRenderTarget';
import { setUniformTexture } from '../utils/webgl';
import { createFillViewportProgram } from '../utils/shader';
import delayFragmentSource from '!!raw-loader!./shaders/delayFragment';

enum Uniforms {
  SRC_TEXTURE = 'u_srcTexture',
  DELAY_TEXTURE = 'u_delayTexture',
  INTENSITY = 'u_intensity',
}

type ConstructorOptions = {
  intensity?: number;
  hdr?: boolean;
}

export class DelayFilter implements Filter {
  active: boolean = true;
  public intensity: number;
  private program: Program;
  private renderTarget: SwappableRenderTarget;
  private copyFilter: CopyFilter;

  constructor(gl: WebGL2RenderingContext, width: number, height: number, {
    intensity = 0.2,
    hdr = false,
  }: ConstructorOptions = {}) {
    this.intensity = intensity;
    this.program = createFillViewportProgram(gl, new FragmentShader(gl, delayFragmentSource, new Set(Object.values(Uniforms))));
    this.renderTarget = hdr ? new SwappableHdrRenderTarget(gl, width, height) : new SwappableLdrRenderTarget(gl, width, height);
    this.copyFilter = new CopyFilter(gl);
  }

  apply(gl: WebGL2RenderingContext, src: RenderTarget, dst: RenderTarget): void {
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderTarget.framebuffer);
    gl.viewport(0.0, 0.0, this.renderTarget.width, this.renderTarget.height);
    gl.useProgram(this.program.program);
    setUniformTexture(gl, 0, src.texture, this.program.getUniform(Uniforms.SRC_TEXTURE));
    setUniformTexture(gl, 1, this.renderTarget.texture, this.program.getUniform(Uniforms.DELAY_TEXTURE));
    gl.uniform1f(this.program.getUniform(Uniforms.INTENSITY), this.intensity);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    this.renderTarget.swap();
    this.copyFilter.apply(gl, this.renderTarget, dst);
  }
}