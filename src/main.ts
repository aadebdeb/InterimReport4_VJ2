import Tweakpane from 'tweakpane';
import Stats from 'stats.js';

import { Vector3 } from './math/vector3';
import { PerspectiveCamera } from './cameras/perspectiveCamera';
import { OrbitCameraController } from './cameras/orbitCameraController';
import { AudioAnalyzer } from './audio/audioAnalyzer';
import { MidiManager } from './audio/midiManager';
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
import { InverseFilter } from './filters/inverseFilter';
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
  threshold: 0.8,
  intensity: 0.05,
  hdr: true,
});
const fxaaFilter = new FxaaFilter(gl);
const delayFilter = new DelayFilter(gl, width, height, {
  intensity: 0.1,
});
const inverseFilter = new InverseFilter(gl);
inverseFilter.active = false;
const divideFilter = new DivideFilter(gl, {
  divideNum: 1,
});
const copyToCanvasFilter = new CopyToCanvasFilter(gl);

const hdrFilters: Filter[] = [
  bloomFilter,
];
const ldrFilters: Filter[] = [
  fxaaFilter,
  delayFilter,
  inverseFilter,
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
  foldX: false,
  foldZ: false,
  repeatY: false,
  boxSubtract: false,
  dispIntensity: 0.0,
}

const screenSpaceRaymarchGeometry = new ScreenSpaceRaymarchGeometry(gl, {
  estimateDisntaceChunk: `
uniform float u_audioLevel;
uniform float u_elapsedSecs;
uniform float u_fftLevels[16];
uniform bool u_foldX;
uniform bool u_foldZ;
uniform bool u_repeatY;
uniform bool u_boxSubtract;
uniform float u_dispIntensity;

#define SPHERE_RADIUS 3.0

float random(float x){
  return fract(sin(x * 12.9898) * 43758.5453);
}

vec3 random3(float x) {
  return fract(sin(x * vec3(12.9898, 51.431, 29.964)) * vec3(43758.5453, 71932.1354, 39215.4221));
}

vec3 srandom3(float x) {
  return random3(x) * 2.0 - 1.0;
}

mat2 rotate(float r) {
  float c = cos(r);
  float s = sin(r);
  return mat2(c, s, -s, c);
}

float sdBox(vec3 p, vec3 b) {
  p = abs(p) - b;
  return length(max(p, 0.0)) + min(max(p.x, max(p.y, p.z)), 0.0);
}

vec3 toObjectPos(vec3 p) {

  // float offset = sin(1.5 * p.y + 1.0 * u_elapsedSecs);
  // p.x += 10.0 * u_audioLevel * sign(offset) * pow(abs(offset), 1.0);

  if (u_foldX) {
    p.x = abs(p.x) - SPHERE_RADIUS;
  }
  if (u_foldZ) {
    p.z = abs(p.z) - SPHERE_RADIUS;
  }
  if (u_repeatY) {
    p.y = mod(p.y, 2.0 * SPHERE_RADIUS) - SPHERE_RADIUS;
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
    p.y += u_dispIntensity * u_audioLevel * u_fftLevels[i] * 0.5 * sin(2.0 * p.x + 5.0 * u_elapsedSecs);
  }

  // p.y += u_audioLevel * 5.0 * sin(2.0 * p.x + 5.0 * u_elapsedSecs);
  float d =  length(p) - SPHERE_RADIUS;


  float s = 1000.0;
  if (u_boxSubtract) {
    for (float i = 0.0; i < 5.0; i++) {
        s = min(s, sdBox(q - 5.0 * srandom3(floor(u_elapsedSecs * 7.5) + i), vec3(8.0) * random3(i)));
    }
  }

  // for (float i = 0.0; i < 5.0; i += 1.0) {
  //   vec3 sp = q + vec3(4.0 * sin(1.43 * u_elapsedSecs), 4.5 * sin(1.52 * u_elapsedSecs), 4.2 * sin(1.73 * u_elapsedSecs));
  //   s = min(s, length(sp) - 3.0);
  // }

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
  uniforms: [
    'u_audioLevel',
    'u_elapsedSecs',
    'u_foldX',
    'u_foldZ',
    'u_repeatY',
    'u_boxSubtract',
    'u_dispIntensity',
    ...(new Array(16).fill(null).map((_, i) => `u_fftLevels[${i}]`))],
  uniformsCallback: (gl, program) => {
    gl.uniform1f(program.getUniform('u_audioLevel'), audioAnalyzer.level);
    gl.uniform1f(program.getUniform('u_elapsedSecs'), elapsedSecs);
    gl.uniform1i(program.getUniform('u_foldX'), screenSpaceRaymarhParameters.foldX ? 1 : 0);
    gl.uniform1i(program.getUniform('u_foldZ'), screenSpaceRaymarhParameters.foldZ ? 1 : 0);
    gl.uniform1i(program.getUniform('u_repeatY'), screenSpaceRaymarhParameters.repeatY ? 1: 0);
    gl.uniform1i(program.getUniform('u_boxSubtract'), screenSpaceRaymarhParameters.boxSubtract ? 1: 0);
    gl.uniform1f(program.getUniform('u_dispIntensity'), screenSpaceRaymarhParameters.dispIntensity);
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
// for KORG nanoKONTROL2
const midiManager = new MidiManager(new Map([
  // slider1
  [[176, 0], (value) => console.log(`slider1: ${value}`)],
  // slider2
  [[176, 1], (value) => console.log(`slider2: ${value}`)],
  // slider3
  [[176, 2], (value) => console.log(`slider3: ${value}`)],
  // slider4
  [[176, 3], (value) => console.log(`slider4: ${value}`)],
  // slider5
  [[176, 4], (value) => console.log(`slider5: ${value}`)],
  // slider6
  [[176, 5], (value) => console.log(`slider6: ${value}`)],
  // slider7
  [[176, 6], (value) => console.log(`slider7: ${value}`)],
  // slider8
  [[176, 7], (value) => console.log(`slider8: ${value}`)],

  // knob1
  [[176, 16], (value) => {
    screenSpaceRaymarhParameters.dispIntensity = 10.0 * value;
  }],
  // knob2
  [[176, 17], (value) => console.log(`knob2: ${value}`)],
  // knob3
  [[176, 18], (value) => console.log(`knob3: ${value}`)],
  // knob4
  [[176, 19], (value) => console.log(`knob4: ${value}`)],
  // knob5
  [[176, 20], (value) => console.log(`knob5: ${value}`)],
  // knob6
  [[176, 21], (value) => console.log(`knob6: ${value}`)],
  // knob7
  [[176, 22], (value) => console.log(`knob7: ${value}`)],
  // knob8
  [[176, 23], (value) => delayFilter.intensity = value,],

  // S1, M1, R1
  [[176, 32], (value) => {
    if (value === 1) {
      screenSpaceRaymarhParameters.foldX = !screenSpaceRaymarhParameters.foldX;
    }
  }],
  [[176, 48], (value) => {
    if (value === 1) {
      screenSpaceRaymarhParameters.foldZ = !screenSpaceRaymarhParameters.foldZ;
    }
  }],
  [[176, 64], (value) => {
    if (value === 1) {
      screenSpaceRaymarhParameters.repeatY = !screenSpaceRaymarhParameters.repeatY;
    }
  }],
  // S2, M2, R2
  [[176, 33], (value) => console.log(`S2: ${value}`)],
  [[176, 49], (value) => console.log(`M2: ${value}`)],
  [[176, 65], (value) => console.log(`R2: ${value}`)],
  // S3, M3, R3
  [[176, 34], (value) => {
    if (value === 1) {
      divideFilter.divideNum = 1;
    }
  }],
  [[176, 50], (value) => {
    if (value === 1) {
      divideFilter.divideNum = 2;
    }
  }],
  [[176, 66], (value) => {
    if (value === 1) {
      divideFilter.divideNum = 3;
    }
  }],
  // S4, M4, R4
  [[176, 35], (value) => {
    if (value === 1) {
      divideFilter.divideNum = 4;
    }
  }],
  [[176, 51], (value) => {
    if (value === 1) {
      divideFilter.divideNum = 5;
    }
  }],
  [[176, 67], (value) => {
    if (value === 1) {
      divideFilter.divideNum = 6;
    }
  }],
  // S5, M5, R5
  [[176, 36], (value) => console.log(`S5: ${value}`)],
  [[176, 52], (value) => console.log(`M5: ${value}`)],
  [[176, 68], (value) => console.log(`R5: ${value}`)],
  // S6, M6, R6
  [[176, 37], (value) => console.log(`S6: ${value}`)],
  [[176, 53], (value) => console.log(`M6: ${value}`)],
  [[176, 69], (value) => console.log(`R6: ${value}`)],
  // S7, M7, R7
  [[176, 38], (value) => console.log(`S7: ${value}`)],
  [[176, 54], (value) => console.log(`M7: ${value}`)],
  [[176, 70], (value) => console.log(`R7: ${value}`)],
  // S8, M8, R8
  [[176, 39], (value) => console.log(`S8: ${value}`)],
  [[176, 55], (value) => console.log(`M8: ${value}`)],
  [[176, 71], (value) => console.log(`R8: ${value}`)],

  // Rewind
  [[176, 43], (value) => {
    if (value === 1) {
      if (updateCameraCallback === updateOrbitCameraCallback) {
        updateCameraCallback = updateFixedCameraCallback;
      } else if (updateCameraCallback === updateFixedCameraCallback) {
        updateCameraCallback = updateOrbitCameraCallback;
      } else {
        throw new Error('no camera type');
      }
    }
  }],
  // Forward
  [[176, 44], (value) => console.log(`Forward: ${value}`)],

  // Stop
  [[176, 42], (value) => console.log(`Stop: ${value}`)],
  // Start
  [[176, 41], (value) => console.log(`Start: ${value}`)],
  // Record
  [[176, 45], (value) => console.log(`Start: ${value}`)],

]));

let requestId: number | null = null;
let elapsedSecs = 0.0;
let previousTime = performance.now();
const loop = () => {
  stats.begin();

  audioAnalyzer.update();
  globalParameters.audioLevel = audioAnalyzer.level;

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
  audioLevel: 0.0,
  audioGain: 1.0,

  cameraType: 'fixed',

  raymarch: {
    foldX: screenSpaceRaymarhParameters.foldX,
    foldZ: screenSpaceRaymarhParameters.foldZ,
    repeatY: screenSpaceRaymarhParameters.repeatY,
    boxSubtract: screenSpaceRaymarhParameters.boxSubtract,
    dispIntensity: screenSpaceRaymarhParameters.dispIntensity,
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
  inverse: {
    active: inverseFilter.active,
  },
  divide: {
    active: divideFilter.active,
    divideNum: divideFilter.divideNum,
  }
};


pane.addButton({
  title: 'start audio capture',
}).on('click', () => audioAnalyzer.initialize());

pane.addButton({
  title: 'connect to midi'
}).on('click', () => midiManager.initialize());

pane.addMonitor(globalParameters, 'audioLevel');

pane.addInput(globalParameters, 'audioGain', {
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
raymarchFolder.addInput(globalParameters.raymarch, 'foldX').on('change', value => {
  screenSpaceRaymarhParameters.foldX = value;
});
raymarchFolder.addInput(globalParameters.raymarch, 'foldZ').on('change', value => {
  screenSpaceRaymarhParameters.foldZ = value;
});
raymarchFolder.addInput(globalParameters.raymarch, 'repeatY').on('change', value => {
  screenSpaceRaymarhParameters.repeatY = value;
});
raymarchFolder.addInput(globalParameters.raymarch, 'boxSubtract').on('change', value => {
  screenSpaceRaymarhParameters.boxSubtract = value;
});
raymarchFolder.addInput(globalParameters.raymarch, 'dispIntensity', {
  min: 0.0,
  max: 10.0,
}).on('change', value => {
  screenSpaceRaymarhParameters.dispIntensity = value;
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
  max: 1.0,
}).on('change', value => {
  bloomFilter.threshold = value;
})
bloomFolder.addInput(globalParameters.bloom, 'intensity', {
  min: 0.0,
  max: 2.0,
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

const inverseFolder = pane.addFolder({
  title: 'inverse',
  expanded: false,
});
inverseFolder.addInput(globalParameters.inverse, 'active').on('change', value => {
  inverseFilter.active = value;
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