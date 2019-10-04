import { FragmentShader } from '../webgl/shader';
import { Program } from '../webgl/program';
import { Filter } from './filter';
import { RenderTarget } from '../renderTargets/renderTarget';
import { createFillViewportProgram } from '../utils/shader';
import { setUniformTexture } from '../utils/webgl';
import tonemapFragmentSource from '!!raw-loader!./shaders/tonemapFragment';

enum Uniforms {
  SRC_TEXTURE = 'u_srcTexture'
}

export class TonemapFilter implements Filter {
  active: boolean = true;
  private program: Program;
  constructor(gl: WebGL2RenderingContext) {
    this.program = createFillViewportProgram(gl,
      new FragmentShader(gl, tonemapFragmentSource, new Set(Object.values(Uniforms))));
  }

  apply(gl: WebGL2RenderingContext, src: RenderTarget, dst: RenderTarget): void {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.framebuffer);
    gl.viewport(0.0, 0.0, dst.width, dst.height);
    gl.useProgram(this.program.program);
    setUniformTexture(gl, 0, src.texture, this.program.getUniform(Uniforms.SRC_TEXTURE));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}