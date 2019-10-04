import { Filter } from './filter';
import { FragmentShader } from '../webgl/shader';
import { Program } from '../webgl/program';
import { RenderTarget } from '../renderTargets/renderTarget';
import { createFillViewportProgram } from '../utils/shader';
import { setUniformTexture } from '../utils/webgl';
import copyFragmentSource from '!!raw-loader!./shaders/copyFragment';

enum Uniforms {
  SRC_TEXTURE = 'u_srcTexture'
}

export class CopyFilter implements Filter {
  active: boolean = true;
  private program: Program;
  constructor(gl: WebGL2RenderingContext) {
    this.program = createFillViewportProgram(gl,
      new FragmentShader(gl, copyFragmentSource, new Set(Object.values(Uniforms))));
  }

  apply(gl: WebGL2RenderingContext, src: RenderTarget, dst: RenderTarget): void {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.framebuffer);
    gl.viewport(0.0, 0.0, dst.width, dst.height);
    gl.useProgram(this.program.program);
    setUniformTexture(gl, 0, src.texture, this.program.getUniform(Uniforms.SRC_TEXTURE));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}