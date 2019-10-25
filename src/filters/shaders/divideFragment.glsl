#version 300 es

precision highp float;

in vec2 v_uv;

out vec4 o_color;

uniform sampler2D u_srcTexture;
uniform int u_divideNum;
uniform bool u_inverse;

void main(void) {
  vec2 st = float(u_divideNum) * v_uv;
  vec2 uv = fract(st);
  vec3 c = texture(u_srcTexture, uv).rgb;
  if (!u_inverse) {
    o_color = vec4(c, 1.0);
    return;
  }
  int idx = int(st.x) + int(st.y);
  if (idx % 2 == 1) {
    o_color = vec4(c, 1.0);
  } else {
    o_color = vec4(1.0 - c, 1.0);
  }
}