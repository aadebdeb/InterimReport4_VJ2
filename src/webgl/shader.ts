export function createShader(gl: WebGL2RenderingContext, source: string, type: GLint): WebGLProgram {
  const shader = <WebGLShader>gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) + source);
  }
  return shader;
}


class Shader {
  readonly shader: WebGLShader;
  readonly uniformNames: Set<string>; 

  constructor(gl: WebGL2RenderingContext, source: string, type: GLint, uniformNames: Set<string>) {
    this.shader = createShader(gl, source, type);
    this.uniformNames = uniformNames;
  }
}

export class VertexShader extends Shader {
  constructor(gl: WebGL2RenderingContext, source: string, uniformNames: Set<string> = new Set()) {
    super(gl, source, gl.VERTEX_SHADER, uniformNames);
  }
}

export class FragmentShader extends Shader {
  constructor(gl: WebGL2RenderingContext, source: string, uniformNames: Set<string> = new Set()) {
    super(gl, source, gl.FRAGMENT_SHADER, uniformNames);
  }
}