#version 300 es

precision highp float;

in vec2 v_uv;

out vec4 o_color;

uniform sampler2D u_srcTexture;
uniform float u_elapsedSecs;
uniform float u_intensity;

void main(void) {
  vec2 uv = v_uv;
  for (float i = 1.0; i <= 5.0; i += 1.0) {
    uv.x += sin(uv.y * 5.0 + u_elapsedSecs * 1.0 + 100.0 * sin(324.324 * i)) * u_intensity;
    uv.y += sin(uv.x * 5.0 + u_elapsedSecs * 1.0 + 100.0 * sin(421.324 * i)) * u_intensity;
  }

  o_color = vec4(texture(u_srcTexture, fract(uv)).rgb, 1.0);
}