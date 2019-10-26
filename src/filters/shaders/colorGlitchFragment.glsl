#version 300 es

precision highp float;

in vec2 v_uv;

out vec4 o_color;

uniform sampler2D u_srcTexture;
uniform float u_elapsedSecs;
uniform float u_intensity;

float random(float x) {
  return fract(sin(x * 12.9898) * 43758.5453);
}

vec2 random2(float x) {
  return fract(sin(x * vec2(12.9898, 51.431)) * vec2(43758.5453, 71932.1354));
}

vec3 palette(vec3 t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318530718 * (t * c + d));
}

void main(void) {
  float timeStep = 100.0 * random(floor(10.0 * u_elapsedSecs));
  float maxGlitch = 10.0 * u_intensity * random(floor(10.0 * u_elapsedSecs));
  float idx = -1.0;
  for (float i = 1.0; i <= maxGlitch; i += 1.0) {
    vec2 center = random2(i + timeStep);
    vec2 size = 0.02 + 0.5 * random2(i + timeStep + 342.443);
    if (abs(center.x - v_uv.x) < size.x && abs(center.y - v_uv.y) < size.y) {
      idx = i;
      break;
    }
  }

  if (idx != -1.0) {
    o_color = vec4(
      palette(texture(u_srcTexture, fract(v_uv)).rgb + u_elapsedSecs + random(idx + timeStep + 432.321) * 100.0,
        vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67)), 1.0);
  } else {
    o_color = vec4(texture(u_srcTexture, fract(v_uv)).rgb, 1.0);
  }
}