#version 300 es

precision highp float;

in vec3 v_dir;

layout (location = 0) out vec3 o_gBufferTarget0;
layout (location = 1) out vec4 o_gBufferTarget1;
layout (location = 2) out vec3 o_gBufferTarget2;
layout (location = 3) out vec3 o_gBufferTarget3;
layout (location = 4) out vec3 o_gBufferTarget4;

uniform mat4 u_cameraModelMatrix;
uniform float u_near;
uniform float u_far;
uniform int u_marchIterations;
uniform float u_distanceScale;
uniform float u_hitDistance;
uniform float u_diffDelta;

struct GBuffer {
  vec3 diffuse;
  vec3 specular;
  float specularIntensity;
  vec3 worldPosition;
  vec3 worldNormal;
  vec3 emission;
};

void setGBuffer(GBuffer gBuffer) {
  o_gBufferTarget0 = gBuffer.diffuse;
  o_gBufferTarget1 = vec4(gBuffer.specular, gBuffer.specularIntensity);
  o_gBufferTarget2 = gBuffer.worldPosition;
  o_gBufferTarget3 = gBuffer.worldNormal;
  o_gBufferTarget4 = gBuffer.emission;
}

${estimateDistance}

${getGBuffer}

vec3 calcNormal(vec3 pos) {
  float eps = 0.01;
  return normalize(vec3(
    estimateDistance(pos + vec3(eps, 0.0, 0.0)) - estimateDistance(pos + vec3(-eps, 0.0, 0.0)),
    estimateDistance(pos + vec3(0.0, eps, 0.0)) - estimateDistance(pos + vec3(0.0, -eps, 0.0)),
    estimateDistance(pos + vec3(0.0, 0.0, eps)) - estimateDistance(pos + vec3(0.0, 0.0, -eps))
  ));
}

void main(void) {
  vec3 ro = (u_cameraModelMatrix * vec4(vec3(0.0), 1.0)).xyz;
  vec3 rd = normalize(v_dir);

  float t = u_near;
  vec3 pos = ro + t * rd;
  for (int i = 0; i < u_marchIterations; i++) {
    float d = u_distanceScale * estimateDistance(pos);
    t += d;
    if (t >= u_far) {
      break;
    }
    pos += d * rd;
    if (d < u_hitDistance) {
      vec3 normal = calcNormal(pos);
      GBuffer gBuffer = getGBuffer(pos, normal);
      setGBuffer(gBuffer);
      gl_FragDepth = 0.5 + 0.5 * ((u_far + u_near) / (u_far - u_near) + (-2.0 * u_far * u_near) / ((u_far - u_near) * t));
      return;
    }
  }
  discard;
}