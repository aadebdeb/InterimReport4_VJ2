import { FragmentShader } from '../webgl/shader';
import { Program } from '../webgl/program';
import { Filter } from './filter';
import { RenderTarget } from '../renderTargets/renderTarget';
import { createFillViewportProgram } from '../utils/shader';
import { setUniformTexture } from '../utils/webgl';
import copyToCanvasFragmentSource from '!!raw-loader!./shaders/copyTocanvasFragment';

enum Uniforms {
  SRC_TEXTURE = 'u_srcTexture',
  CANVAS_SIZE = 'u_canvasSize',
}

export class CopyToCanvasFilter implements Filter {
  active: boolean = true;
  private program: Program;
  constructor(gl: WebGL2RenderingContext) {
    this.program = createFillViewportProgram(gl, new FragmentShader(gl,
      copyToCanvasFragmentSource, new Set(Object.values(Uniforms))));
  }

  get effective(): boolean {
    return true;
  }

  apply(gl: WebGL2RenderingContext, src: RenderTarget, dst: RenderTarget) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.framebuffer);
    gl.viewport(0.0, 0.0, dst.width, dst.height);
    gl.useProgram(this.program.program);
    setUniformTexture(gl, 0, src.texture, this.program.getUniform(Uniforms.SRC_TEXTURE));
    gl.uniform2f(this.program.getUniform(Uniforms.CANVAS_SIZE), dst.width, dst.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}