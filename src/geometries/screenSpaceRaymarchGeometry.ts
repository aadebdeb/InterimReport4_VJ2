import { VertexShader, FragmentShader } from '../webgl/shader';
import { Program } from '../webgl/program';
import { PerspectiveCamera } from '../cameras/perspectiveCamera';
import screenSpaceRaymarchGeometryVertexSource from '!!raw-loader!./screenSpaceRaymarchShaders/screenSpaceRaymarchGeometryVertex';
import screenSpaceRaymarchGeometryFragmentSource from '!!raw-loader!./screenSpaceRaymarchShaders/screenSpaceRaymarchGeometryFragment';

enum VertexUniforms {
  CAMERA_MODEL_MATRIX = 'u_cameraModelMatrix',
  FOCAL_SCALE = 'u_focalScale',
}

enum FragmentUniforms {
  CAMERA_MODEL_MATRIX = 'u_cameraModelMatrix',
  NEAR = 'u_near',
  FAR = 'u_far',
}

const DEFAULT_ESTIMATE_DISTANCE_CHUNK = `
float estimateDistance(vec3 p) {
  return length(p) - 3.0;
}
`;

const DEFAULT_GET_GBUFFER_CHUNK = `
GBuffer getGBuffer(vec3 worldPosition, vec3 worldNormal) {
  GBuffer gBuffer;
  gBuffer.diffuse = vec3(0.01);
  gBuffer.specular = vec3(0.3);
  gBuffer.specularIntensity = 0.2;
  gBuffer.worldPosition = worldPosition;
  gBuffer.worldNormal = worldNormal;
  gBuffer.emission = vec3(0.0);
  return gBuffer;
}
`;

const ESTIMATE_DISTANCE_CHUNK_REGEX = /\$\{estimateDistance\}/;
const GET_GBUFFER_REGEX = /\$\{getGBuffer\}/

function createFragmentShaderSource(estimateDisntaceChunk: string, getGBufferChunk: string) {
  return screenSpaceRaymarchGeometryFragmentSource
    .replace(ESTIMATE_DISTANCE_CHUNK_REGEX, estimateDisntaceChunk)
    .replace(GET_GBUFFER_REGEX, getGBufferChunk);
}

type UniformCallback = (gl: WebGL2RenderingContext, program: Program) => void;

type ConstructorOptions = {
  estimateDisntaceChunk?: string,
  getGBufferChunk?: string,
  uniforms?: string[],
  uniformsCallback?: UniformCallback,
};

export class ScreenSpaceRaymarchGeometry {
  private program: Program;
  private uniformsCallback: UniformCallback;

  constructor(gl: WebGL2RenderingContext, {
    estimateDisntaceChunk =  DEFAULT_ESTIMATE_DISTANCE_CHUNK,
    getGBufferChunk = DEFAULT_GET_GBUFFER_CHUNK,
    uniforms = [],
    uniformsCallback = () => {},
  }: ConstructorOptions = {}) {
    const vertShader = new VertexShader(gl, screenSpaceRaymarchGeometryVertexSource, new Set(Object.values(VertexUniforms)));
    const fragShader = new FragmentShader(
      gl, createFragmentShaderSource(estimateDisntaceChunk, getGBufferChunk), new Set([...Object.values(FragmentUniforms), ...uniforms]));
    this.program = new Program(gl, vertShader, fragShader);
    this.uniformsCallback = uniformsCallback;
  }

  render(gl: WebGL2RenderingContext, camera: PerspectiveCamera): void {
    gl.useProgram(this.program.program);
    gl.uniformMatrix4fv(this.program.getUniform(VertexUniforms.CAMERA_MODEL_MATRIX), false, camera.modelMatrix.elements);
    const focalScaleY = Math.tan(0.5 * camera.vfov * Math.PI / 180.0);
    gl.uniform2f(this.program.getUniform(VertexUniforms.FOCAL_SCALE), camera.aspect * focalScaleY, focalScaleY);
    gl.uniform1f(this.program.getUniform(FragmentUniforms.NEAR), camera.near);
    gl.uniform1f(this.program.getUniform(FragmentUniforms.FAR), camera.far);
    this.uniformsCallback(gl, this.program);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}