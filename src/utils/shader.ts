import { VertexShader, FragmentShader } from '../webgl/shader';
import { Program } from '../webgl/program';
import fillViewportVertexSource from '!!raw-loader!../shaders/fillViewportVertex';

let fillViewportVertexShader: VertexShader | null;

export function createFillViewportProgram(gl: WebGL2RenderingContext, fragShader: FragmentShader): Program {
  if (fillViewportVertexShader == null) {
    fillViewportVertexShader = new VertexShader(gl, fillViewportVertexSource);
  }
  return new Program(gl, fillViewportVertexShader, fragShader);
}