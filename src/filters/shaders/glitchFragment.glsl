#version 300 es

precision highp float;

in vec2 v_uv;

out vec4 o_color;

uniform sampler2D u_srcTexture;
uniform float u_elapsedSecs;
uniform float u_shiftXIntensity;
uniform float u_shiftYIntensity;
uniform float u_shiftXRate;
uniform float u_shiftYRate;

float random(float x) {
  return fract(sin(x * 12.9898) * 43758.5453);
}

float srandom(float x) {
  return 2.0 * random(x) - 1.0;
}

void main(void) {

  vec2 uv = v_uv;

  float timeStep = 100.0 * random(floor(10.0 * u_elapsedSecs));

  float shiftPosY = floor(10.0 * (v_uv.y * (1.0 + 0.2 * sin(10.0 * v_uv.y + timeStep))) + timeStep);
  if (random(shiftPosY) < u_shiftXRate) {

    float start = random(1000.0 + shiftPosY);
    float width = u_shiftXIntensity * random(123.0 + shiftPosY);


    if (random(243.0 + shiftPosY) < 0.5) {
      if (uv.x >= start) {
        uv.x = max(start, uv.x - width);
      }
    } else {
      if (uv.x <= start) {
        uv.x = min(start, uv.x + width);
      }
    }
  }

  float shiftPosX = floor(10.0 * (v_uv.x * (1.0 + 0.2 * sin(10.0 * v_uv.x + timeStep))) + timeStep);
  if (random(432.0 + shiftPosX) < u_shiftYRate) {

    float start = random(103.0 + shiftPosX);
    float width = u_shiftYIntensity * random(342.0 + shiftPosX);

    if (random(243.0 + shiftPosX) < 0.5) {
      if (uv.y >= start) {
        uv.y = max(start, uv.y - width);
      }
    } else {
      if (uv.y <= start) {
        uv.y = min(start, uv.y + width);
      }
    }
  }

  o_color = vec4(texture(u_srcTexture, fract(uv)).rgb, 1.0);
}