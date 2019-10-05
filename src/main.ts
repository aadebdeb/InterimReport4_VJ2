import Tweakpane from 'tweakpane';
import Stats from 'stats.js';

import { Vector3 } from './math/vector3';
import { PerspectiveCamera } from './cameras/perspectiveCamera';
import { OrbitCameraController } from './cameras/orbitCameraController';
import { AudioAnalyzer } from './audio/audioAnalyzer';
import { ScreenSpaceRaymarchGeometry } from './geometries/screenSpaceRaymarchGeometry';
import { GBuffer } from './core/gBuffer';
import { SwappableHdrRenderTarget } from './renderTargets/swappableHdrRenderTarget';
import { SwappableLdrRenderTarget } from './renderTargets/swappableLdrRenderTarget';
import { CanvasRenderTarget } from './renderTargets/canvasRenderTarget';
import { LightingApplier } from './core/lightingApplier';
import { Filter } from './filters/filter';
import { TonemapFilter } from './filters/tonemapFilter';
import { BloomFilter } from './filters/bloomFilter';
import { FxaaFilter } from './filters/fxaaFilter';
import { DelayFilter } from './filters/delayFilter';
import { DivideFilter } from './filters/divideFilter';
import { CopyToCanvasFilter } from './filters/copyToCanvasFilter';

const canvas = document.createElement('canvas');
canvas.width = innerWidth;
canvas.height = innerHeight;
document.body.appendChild(canvas);

const gl = <WebGL2RenderingContext>canvas.getContext('webgl2');
gl.getExtension('EXT_color_buffer_float');
gl.enable(gl.CULL_FACE);
gl.clearColor(0.0, 0.0, 0.0, 1.0);

const stats = new Stats();
const statsWrapper = document.createElement('div');
statsWrapper.appendChild(stats.dom);
document.body.appendChild(statsWrapper);

const width = 1280;
const height = 720;

const gBuffer = new GBuffer(gl, width, height);
const hdrTarget = new SwappableHdrRenderTarget(gl, width, height);
const ldrTarget = new SwappableLdrRenderTarget(gl, width, height);
let canvasTarget = new CanvasRenderTarget(canvas.width, canvas.height);

const tonemapFilter = new TonemapFilter(gl);
const bloomFilter = new BloomFilter(gl, width, height, {
  threshold: 0.95,
  intensity: 0.1,
  hdr: true,
});
const fxaaFilter = new FxaaFilter(gl);
const delayFilter = new DelayFilter(gl, width, height, {
  intensity: 0.1,
});
const divideFilter = new DivideFilter(gl);
divideFilter.active = false;
const copyToCanvasFilter = new CopyToCanvasFilter(gl);

const hdrFilters: Filter[] = [
  bloomFilter,
];
const ldrFilters: Filter[] = [
  fxaaFilter,
  delayFilter,
  divideFilter,
];

const camera = new PerspectiveCamera(width / height, 60.0, 0.1, 100.0);
const orbitCameraController = new OrbitCameraController(camera);

let updateFixedCameraCallback = () => {
  camera.lookAt(
    new Vector3(0.0, 0.0, 8.0),
    Vector3.zero,
    new Vector3(0.0, 1.0, 0.0)
  );
}
let updateOrbitCameraCallback = (deltaSecs: number) => {
  orbitCameraController.update(deltaSecs);
}
let updateCameraCallback: (deltaSecs: number) => void = updateFixedCameraCallback;

const screenSpaceRaymarhParameters = {
  fold: false,
}

const screenSpaceRaymarchGeometry = new ScreenSpaceRaymarchGeometry(gl, {
  estimateDisntaceChunk: `
uniform float u_audioLevel;
uniform float u_elapsedSecs;
uniform float u_fftLevels[16];
uniform bool u_fold;

#define SPHERE_RADIUS 3.0

float random(float x){
  return fract(sin(x * 12.9898) * 43758.5453);
}

mat2 rotate(float r) {
  float c = cos(r);
  float s = sin(r);
  return mat2(c, s, -s, c);
}

#define smin(a, b, k) (-log2(exp2(-k*a)+exp2(-k*b))/k)
#define sabs(p, k) (abs(p)-2.0*smin(0.0,abs(p),k))

vec3 toObjectPos(vec3 p) {
  if (u_fold) {
    //p.x = abs(p.x) - 3.0;
    p.xyz = abs(p.xyz) - 3.0;
    p.y = mod(p.y, 6.0) - 3.0;
  }
  return p;
}

float estimateDistance(vec3 p) {
  p = toObjectPos(p);
  vec3 q = p;

  // p.y += sign(p.x) * smoothstep(0.0, 1.0, abs(p.x));

  // p.xz *= rotate(0.1 * u_elapsedSecs);

  for (int i = 0; i < 16; i++) {
    p.xy *= rotate(random(float(i)) + u_elapsedSecs);
    p.xz *= rotate(random(float(i) + 0.43) + u_elapsedSecs);
    p.y += 5.0 * u_audioLevel * u_fftLevels[i] * 0.5 * sin(2.0 * p.x + 5.0 * u_elapsedSecs);
  }

  // p.y += u_audioLevel * 5.0 * sin(2.0 * p.x + 5.0 * u_elapsedSecs);
  float d =  length(p) - SPHERE_RADIUS;

  float s = 1000.0;
  for (float i = 0.0; i < 5.0; i += 1.0) {
    vec3 sp = q + vec3(4.0 * sin(1.43 * u_elapsedSecs), 4.5 * sin(1.52 * u_elapsedSecs), 4.2 * sin(1.73 * u_elapsedSecs));
    s = min(s, length(sp) - 3.0);
  }

  // float s = length(q.xy) - 1.0;

  return max(d, -s);
}
  `,
  getGBufferChunk: `
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318530718 * (t * c + d));
}

GBuffer getGBuffer(vec3 worldPosition, vec3 worldNormal) {
  vec3 p = toObjectPos(worldPosition);
  GBuffer gBuffer;
  gBuffer.diffuse = vec3(0.01);
  gBuffer.specular = vec3(0.3);
  gBuffer.specularIntensity = 0.2;
  gBuffer.worldPosition = worldPosition;
  gBuffer.worldNormal = worldNormal;
  gBuffer.emission = mix(
    palette(20.0 * length(p) + u_elapsedSecs, vec3(0.2), vec3(0.8), vec3(1.0, 2.0, 1.5), vec3(1.0, 0.1, 0.02)),
    vec3(0.00),
    smoothstep(0.98 * SPHERE_RADIUS, 0.99 * SPHERE_RADIUS, length(p))
  );
  return gBuffer;
}
  `,
  uniforms: ['u_audioLevel', 'u_elapsedSecs', 'u_fold', ...(new Array(16).fill(null).map((_, i) => `u_fftLevels[${i}]`))],
  uniformsCallback: (gl, program) => {
    gl.uniform1f(program.getUniform('u_audioLevel'), audioAnalyzer.level);
    gl.uniform1f(program.getUniform('u_elapsedSecs'), elapsedSecs);
    gl.uniform1i(program.getUniform('u_fold'), screenSpaceRaymarhParameters.fold ? 1 : 0);
    for (let i = 0; i < 16; i++) {
      gl.uniform1f(program.getUniform(`u_fftLevels[${i}]`), audioAnalyzer.frequencyDomainArray[i * 16]);
    }
  },
  marchIterations: 256,
  distanceScale: 0.5,
  hitDistance: 0.001,
});

const lightingApplier = new LightingApplier(gl);

const audioAnalyzer = new AudioAnalyzer();

let requestId: number | null = null;
let elapsedSecs = 0.0;
let previousTime = performance.now();
const loop = () => {
  stats.begin();

  audioAnalyzer.update();

  const currentTime = performance.now();
  const deltaSecs = Math.min(0.1, (currentTime - previousTime) * 0.001);
  elapsedSecs += deltaSecs;
  previousTime = currentTime;

  updateCameraCallback(deltaSecs);
 
  gl.enable(gl.DEPTH_TEST);
  gl.bindFramebuffer(gl.FRAMEBUFFER, gBuffer.framebuffer);
  gl.viewport(0.0, 0.0, gBuffer.width, gBuffer.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  screenSpaceRaymarchGeometry.render(gl, camera);

  gl.disable(gl.DEPTH_TEST);
  lightingApplier.apply(gl, gBuffer, hdrTarget, camera);
  hdrTarget.swap();

  hdrFilters.forEach(filter => {
    if (filter.active) {
      filter.apply(gl, hdrTarget, hdrTarget);
      hdrTarget.swap();
    }
  });
  tonemapFilter.apply(gl, hdrTarget, ldrTarget);
  ldrTarget.swap();
  ldrFilters.forEach(filter => {
    if (filter.active) {
      filter.apply(gl, ldrTarget, ldrTarget);
      ldrTarget.swap();
    }
  });

  copyToCanvasFilter.apply(gl, ldrTarget, canvasTarget);


  stats.end();
  requestId = requestAnimationFrame(loop);
}

addEventListener('resize', () => {
  if (requestId != null) {
    cancelAnimationFrame(requestId);
    requestId = null;
  }
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  canvasTarget = new CanvasRenderTarget(canvas.width, canvas.height);
  requestId = requestAnimationFrame(loop);
});

const pane = new Tweakpane();

const globalParameters = {
  audioVolume: 1.0,

  cameraType: 'fixed',

  raymarch: {
    fold: screenSpaceRaymarhParameters.fold,
  },

  bloom: {
    active: bloomFilter.active,
    threshold: bloomFilter.threshold,
    intensity: bloomFilter.intensity,
  },
  delay: {
    active: delayFilter.active,
    intensity: delayFilter.intensity,
  },
  divide: {
    active: divideFilter.active,
    divideNum: divideFilter.divideNum,
  }
};


pane.addButton({
  title: 'start audio capture',
}).on('click', () => audioAnalyzer.initialize());

pane.addInput(globalParameters, 'audioVolume', {
  min: 0.0,
  max: 5.0,
}).on('change', (value) => {
  audioAnalyzer.gain = value;
});

pane.addInput(globalParameters, 'cameraType', {
  options: {
    fixed: 'fixed',
    orbit: 'orbit',
  }
}).on('change', value => {
  if (value === 'fixed') {
    updateCameraCallback = updateFixedCameraCallback;
  } else if (value === 'orbit') {
    updateCameraCallback = updateOrbitCameraCallback;
  } else {
    throw new Error('no camera type');
  }
});

pane.addButton({
  title: 'relocate orbit camera',
}).on('click', () => orbitCameraController.reset());

const raymarchFolder = pane.addFolder({
  title: 'raymarch',
  expanded: false,
});
raymarchFolder.addInput(globalParameters.raymarch, 'fold').on('change', value => {
  screenSpaceRaymarhParameters.fold = value;
});

const bloomFolder = pane.addFolder({
  title: 'bloom',
  expanded: false,
});
bloomFolder.addInput(globalParameters.bloom, 'active').on('change', value => {
  bloomFilter.active = value;
});
bloomFolder.addInput(globalParameters.bloom, 'threshold', {
  min: 0.0,
  max: 5.0,
}).on('change', value => {
  bloomFilter.threshold = value;
})
bloomFolder.addInput(globalParameters.bloom, 'intensity', {
  min: 0.0,
  max: 5.0,
}).on('change', value => {
  bloomFilter.intensity = value;
});

const delayFolder = pane.addFolder({
  title: 'delay',
  expanded: false,
});
delayFolder.addInput(globalParameters.delay, 'active').on('change', value => {
  delayFilter.active = value;
});
delayFolder.addInput(globalParameters.delay, 'intensity', {
  min: 0.0,
  max: 0.99,
}).on('change', value => {
  delayFilter.intensity = value;
});

const divideFolder = pane.addFolder({
  title: 'divide',
  expanded: false,
});
divideFolder.addInput(globalParameters.divide, 'active').on('change', value => {
  divideFilter.active = value;
});
divideFolder.addInput(globalParameters.divide, 'divideNum', {
  min: 1,
  max: 6,
  step: 1,
}).on('change', value => {
  divideFilter.divideNum = value;
});

const paneDom = document.getElementsByClassName('tp-dfwv')[0];
let enableGui = true;
addEventListener('keydown', (e) => {
  if(e.keyCode === 80) { // 'p'
    if (enableGui) {
      statsWrapper.setAttribute('style', 'display: none;');
      paneDom.setAttribute('style', 'display: none;');
      enableGui = false;
    } else {
      statsWrapper.removeAttribute('style');
      paneDom.removeAttribute('style');
      enableGui = true;
    }
  }
});


requestId = requestAnimationFrame(loop);