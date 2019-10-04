import { RenderTarget } from '../renderTargets/renderTarget';
import { SwappableRenderTarget } from '../renderTargets/swappableRenderTarget';
import { SwappableHdrRenderTarget } from '../renderTargets/swappableHdrRenderTarget';
import { SwappableLdrRenderTarget } from '../renderTargets/swappableLdrRenderTarget';
import { FragmentShader } from '../webgl/shader';
import { Program } from '../webgl/program';
import { CopyFilter } from './copyFilter';
import { createFillViewportProgram } from '../utils/shader';
import { setUniformTexture } from '../utils/webgl';
import blurFragmentSource from '!!raw-loader!./shaders/blurFragment';

enum Uniforms {
  SRC_TEXTURE = 'u_srcTexture',
  HORIZONTAL = 'u_horizontal',
}

type ConstructorOptions = {
  hdr?: boolean,
  blurIterations?: number,
}

export class BlurApplier {
  private blurIterations: number;
  private program: Program;
  private copyFilter: CopyFilter;
  private renderTarget: SwappableRenderTarget;
  constructor(gl: WebGL2RenderingContext, width: number, height: number, {
    hdr = false,
    blurIterations = 5,
  }: ConstructorOptions = {}) {
    this.blurIterations = blurIterations;
    this.program = createFillViewportProgram(gl,
      new FragmentShader(gl, blurFragmentSource, new Set(Object.values(Uniforms))));
    this.copyFilter = new CopyFilter(gl);
    this.renderTarget = hdr ? new SwappableHdrRenderTarget(gl, width, height) : new SwappableLdrRenderTarget(gl, width, height);
  }

  apply(gl: WebGL2RenderingContext, src: RenderTarget): WebGLTexture {
    this.copyFilter.apply(gl, src, this.renderTarget);
    this.renderTarget.swap();
    gl.viewport(0.0, 0.0, this.renderTarget.width, this.renderTarget.height);
    for (let i = 0; i < this.blurIterations; i++) {
      this.applyDirectionalBlur(gl, true);
      this.applyDirectionalBlur(gl, false);
    }
    return this.renderTarget.texture;
  }

  private applyDirectionalBlur(gl: WebGL2RenderingContext, horiznotal: boolean): void {
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderTarget.framebuffer);
    gl.useProgram(this.program.program);
    setUniformTexture(gl, 0, this.renderTarget.texture, this.program.getUniform(Uniforms.SRC_TEXTURE));
    gl.uniform1i(this.program.getUniform(Uniforms.HORIZONTAL), horiznotal ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    this.renderTarget.swap();
  }
}