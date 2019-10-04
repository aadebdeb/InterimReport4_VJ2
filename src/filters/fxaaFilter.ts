import { Filter } from './filter';
import { Program } from '../webgl/program';
import { RenderTarget } from '../renderTargets/renderTarget';
import { createFillViewportProgram } from '../utils/shader';
import { setUniformTexture } from '../utils/webgl';
import fxaaFragmentSource from '!!raw-loader!./shaders/fxaaFragment';
import { FragmentShader } from '../webgl/shader';

enum Uniforms {
  SRC_TEXTURE = 'u_srcTexture',
  RESOLUTION = 'u_resolution',
}

export class FxaaFilter implements Filter {
  active: boolean = true;
  private program: Program;
  constructor(gl: WebGL2RenderingContext) {
    this.program = createFillViewportProgram(gl, new FragmentShader(gl, fxaaFragmentSource, new Set(Object.values(Uniforms))));
  }

  apply(gl: WebGL2RenderingContext, src: RenderTarget, dst: RenderTarget): void {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.framebuffer);
    gl.viewport(0.0, 0.0, dst.width, dst.height);
    gl.useProgram(this.program.program);
    setUniformTexture(gl, 0, src.texture, this.program.getUniform('u_srcTexture'));
    gl.uniform2f(this.program.getUniform(Uniforms.RESOLUTION), src.width, src.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}