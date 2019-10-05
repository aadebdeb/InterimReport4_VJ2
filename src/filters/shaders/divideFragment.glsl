#version 300 es

precision highp float;

in vec2 v_uv;

out vec4 o_color;

uniform sampler2D u_srcTexture;
uniform int u_divideNum;

void main(void) {
  o_color = vec4(texture(u_srcTexture, fract(float(u_divideNum) * v_uv)).rgb, 1.0);
}