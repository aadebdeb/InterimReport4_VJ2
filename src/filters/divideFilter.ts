import { FragmentShader } from '../webgl/shader';
import { Program } from '../webgl/program';
import { Filter } from './filter';
import { RenderTarget } from '../renderTargets/renderTarget';
import { createFillViewportProgram } from '../utils/shader';
import { setUniformTexture } from '../utils/webgl';
import divideFragmentSource from '!!raw-loader!./shaders/divideFragment';

enum Uniforms {
  SRC_TEXTURE = 'u_srcTexture',
  DIVIDE_NUM = 'u_divideNum',
}

type ConstructorOptions = {
  divideNum?: number
}

export class DivideFilter implements Filter {
  divideNum: number;
  active: boolean = true;
  private program: Program;

  constructor(gl: WebGL2RenderingContext, {
    divideNum = 2,
  }: ConstructorOptions = {}) {
    this.program = createFillViewportProgram(gl,
      new FragmentShader(gl, divideFragmentSource, new Set(Object.values(Uniforms))));
    this.divideNum = divideNum;
  }

  apply(gl: WebGL2RenderingContext, src: RenderTarget, dst: RenderTarget): void {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.framebuffer);
    gl.viewport(0.0, 0.0, dst.width, dst.height);
    gl.useProgram(this.program.program);
    setUniformTexture(gl, 0, src.texture, this.program.getUniform(Uniforms.SRC_TEXTURE));
    gl.uniform1i(this.program.getUniform(Uniforms.DIVIDE_NUM), this.divideNum);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}