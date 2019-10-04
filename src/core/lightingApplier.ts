import { FragmentShader } from '../webgl/shader';
import { Program } from '../webgl/program';
import { GBuffer } from './gBuffer';
import { Camera } from '../cameras/camera';
import { RenderTarget } from '../renderTargets/renderTarget';
import { createFillViewportProgram } from '../utils/shader';
import { setUniformTexture } from '../utils/webgl';
import lightingFragmentSource from '!!raw-loader!../shaders/lightingFragment';

enum Uniforms {
  COLOR_TEXTURE0 = 'u_colorTexture0',
  COLOR_TEXTURE1 = 'u_colorTexture1',
  COLOR_TEXTURE2 = 'u_colorTexture2',
  COLOR_TEXTURE3 = 'u_colorTexture3',
  COLOR_TEXTURE4 = 'u_colorTexture4',
  DEPTH_TEXTURE = 'u_depthTexture',
  WORLD_CAMERA_POS = 'u_worldCameraPos',
}

export class LightingApplier {
  private program: Program;
  constructor(gl: WebGL2RenderingContext) {
    this.program = createFillViewportProgram(gl, new FragmentShader(gl, lightingFragmentSource, new Set(Object.values(Uniforms))));
  }

  apply(gl: WebGL2RenderingContext, gBuffer: GBuffer, dst: RenderTarget, camera: Camera): void {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.framebuffer);
    gl.viewport(0.0, 0.0, dst.width, dst.height);
    gl.useProgram(this.program.program);
    setUniformTexture(gl, 0, gBuffer.colorTexture0, this.program.getUniform(Uniforms.COLOR_TEXTURE0));
    setUniformTexture(gl, 1, gBuffer.colorTexture1, this.program.getUniform(Uniforms.COLOR_TEXTURE1));
    setUniformTexture(gl, 2, gBuffer.colorTexture2, this.program.getUniform(Uniforms.COLOR_TEXTURE2));
    setUniformTexture(gl, 3, gBuffer.colorTexture3, this.program.getUniform(Uniforms.COLOR_TEXTURE3));
    setUniformTexture(gl, 4, gBuffer.colorTexture4, this.program.getUniform(Uniforms.COLOR_TEXTURE4));
    setUniformTexture(gl, 5, gBuffer.depthTexture, this.program.getUniform(Uniforms.DEPTH_TEXTURE));
    gl.uniform3fv(this.program.getUniform(Uniforms.WORLD_CAMERA_POS), camera.position.toArray());
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}