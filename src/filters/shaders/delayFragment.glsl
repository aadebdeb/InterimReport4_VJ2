#version 300 es

precision highp float;

in vec2 v_uv;
out vec4 o_color;

uniform sampler2D u_srcTexture;
uniform sampler2D u_delayTexture;
uniform float u_intensity;

void main(void) {
  o_color = vec4(mix(texture(u_srcTexture, v_uv).rgb, texture(u_delayTexture, v_uv).rgb, u_intensity), 1.0);
}