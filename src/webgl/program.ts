import { VertexShader, FragmentShader } from "./shader";

function createProgram(gl: WebGL2RenderingContext, vertShader: WebGLShader, fragShader: WebGLShader): WebGLProgram {
  const program = <WebGLProgram>gl.createProgram();
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(<string>gl.getProgramInfoLog(program));
  }
  return program;
}

function createUniforms(gl: WebGL2RenderingContext, program: WebGLProgram, names: Set<string>): Map<string, WebGLUniformLocation> {
  return [...names].reduce((map, name) => {
    map.set(name, gl.getUniformLocation(program, name));
    return map;
  }, new Map());
}

export class Program {
  readonly program: WebGLProgram;
  readonly uniforms: Map<string, WebGLUniformLocation>;

  constructor(gl: WebGL2RenderingContext, vertShader: VertexShader, fragShader: FragmentShader) {
    this.program = createProgram(gl, vertShader.shader, fragShader.shader);
    const uniformNames = new Set([...vertShader.uniformNames, ...fragShader.uniformNames]);
    this.uniforms = createUniforms(gl, this.program, uniformNames);
  }

  public getUniform(name: string): WebGLUniformLocation {
    const loc = this.uniforms.get(name);
    if (loc === undefined) {
      throw new Error(`no uniform ${name}`);
    }
    return loc;
  }
}