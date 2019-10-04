#version 300 es

precision highp float;

in vec2 v_uv;

out vec4 o_color;

uniform sampler2D u_srcTexture;
uniform vec2 u_canvasSize;

void main(void) {
  vec2 texSize = vec2(textureSize(u_srcTexture, 0));
  float canAspect = u_canvasSize.x / u_canvasSize.y;
  float texAspect = texSize.x / texSize.y;
  float invCanAspect = 1.0 / canAspect;
  float invTexAspect = 1.0 / texAspect;

  vec2 uv;
  if (canAspect > texAspect) {
    uv = vec2(
      (canAspect * gl_FragCoord.x / u_canvasSize.x - 0.5 * (canAspect - texAspect)) * invTexAspect,
      gl_FragCoord.y / u_canvasSize.y
    );
  } else {
    uv = vec2(
      gl_FragCoord.x / u_canvasSize.x,
      (invCanAspect * gl_FragCoord.y / u_canvasSize.y - 0.5 * (invCanAspect - invTexAspect)) * texAspect
    );
  }

  vec3 c = uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0 ? texture(u_srcTexture, uv).rgb : vec3(0.0);
  o_color = vec4(c, 1.0);
}