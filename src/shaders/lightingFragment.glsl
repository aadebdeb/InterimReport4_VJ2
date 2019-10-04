#version 300 es

precision highp float;

in vec2 v_uv;

out vec4 o_color;

uniform sampler2D u_colorTexture0;
uniform sampler2D u_colorTexture1;
uniform sampler2D u_colorTexture2;
uniform sampler2D u_colorTexture3;
uniform sampler2D u_colorTexture4;
uniform sampler2D u_depthTexture;
uniform vec3 u_worldCameraPos;

#define saturate(x) clamp(x, 0.0, 1.0)
#define getDepth(uv) texture(u_depthTexture, uv).r

struct GBuffer {
  vec3 albedo;
  vec3 reflectance;
  float reflectIntensity;
  vec3 worldPosition;
  vec3 worldNormal;
  vec3 emission;
};

GBuffer getGBuffer(vec2 uv) {
  vec4 c0 = texture(u_colorTexture0, uv);
  vec4 c1 = texture(u_colorTexture1, uv);
  vec4 c2 = texture(u_colorTexture2, uv);
  vec4 c3 = texture(u_colorTexture3, uv);
  vec4 c4 = texture(u_colorTexture4, uv);
  GBuffer gBuffer;
  gBuffer.albedo = c0.xyz;
  gBuffer.reflectance = c1.xyz;
  gBuffer.reflectIntensity = c1.w;
  gBuffer.worldPosition = c2.xyz;
  gBuffer.worldNormal = c3.xyz;
  gBuffer.emission = c4.xyz;
  return gBuffer;
}

const vec3 lightDir = normalize(vec3(0.0, 1.0, 0.0));

vec3 schlickFresnel(vec3 f0, float cosine) {
  return f0 + (1.0 - f0) * pow(1.0 - cosine, 5.0);
}

void main(void) {
  float depth = getDepth(v_uv);
  if (depth == 1.0) {
    o_color = vec4(vec3(0.0), 1.0);
    return;
  };

  GBuffer gBuffer = getGBuffer(v_uv);

  float dotNL = dot(gBuffer.worldNormal, lightDir);
  vec3 viewDir = normalize(u_worldCameraPos - gBuffer.worldPosition);
  float dotNV = dot(gBuffer.worldNormal, viewDir);

  vec3 diff = gBuffer.albedo * (dotNL * 0.5 + 0.5);

  vec3 refDir = reflect(-viewDir, gBuffer.worldNormal);
  float dotLR = saturate(dot(lightDir, refDir));
  vec3 spec = gBuffer.reflectance * pow(dotLR, 16.0);;
  // vec3 spec = gBuffer.reflectIntensity * schlickFresnel(gBuffer.reflectance, saturate(dotNV));
  vec3 emission = gBuffer.emission;

  o_color = vec4(diff + spec + emission, 1.0);
  // o_color = vec4(gBuffer.worldNormal * 0.5 + 0.5, 1.0);
  // o_color = vec4(gBuffer.worldPosition, 1.0);
}