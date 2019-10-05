type ConstructorOptions = {
  fftSize?: number,
  minDecibels?: number,
  maxDecibels?: number
}

export class AudioAnalyzer {
  private initialized = false;
  private fftSize: number;
  private minDecibels: number;
  private maxDecibels: number;
  readonly timeDomainArray: Float32Array;
  readonly frequencyDomainArray: Float32Array;
  private _level: number = 0.0;
  private gainNode: GainNode | null = null;
  private analyzer: AnalyserNode | null = null;
  constructor({
    fftSize = 2048,
    minDecibels = -100,
    maxDecibels = -30
  }: ConstructorOptions = {}) {
    this.fftSize = fftSize;
    this.minDecibels = minDecibels;
    this.maxDecibels = maxDecibels;
    this.timeDomainArray = new Float32Array(fftSize);
    this.frequencyDomainArray = new Float32Array(new Array(0.5 * fftSize).fill(0.0));
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    const context = new AudioContext();
    const stream = await navigator.mediaDevices.getUserMedia({audio: true});
    const input = context.createMediaStreamSource(stream);
    this.gainNode = new GainNode(context);
    this.analyzer = new AnalyserNode(context,
      {fftSize: this.fftSize, minDecibels: this.minDecibels, maxDecibels: this.maxDecibels});
    input.connect(this.gainNode);
    this.gainNode.connect(this.analyzer);
    this.initialized = true;
  }

  update(): void {
    if (this.analyzer === null) {
      return;
    }
    this.analyzer.getFloatTimeDomainData(this.timeDomainArray);
    this.analyzer.getFloatFrequencyData(this.frequencyDomainArray);
    for (let i = 0; i < this.frequencyDomainArray.length; i++) {
      this.frequencyDomainArray[i] = (this.frequencyDomainArray[i] - this.minDecibels) / (this.maxDecibels - this.minDecibels);
    }
    this._level = this.timeDomainArray.reduce((sum, value) => sum + Math.abs(value), 0.0) / this.timeDomainArray.length;
  }

  get level() {
    return this._level;
  }

  set gain(value: number) {
    if (this.gainNode == null) {
      return;
    }
    this.gainNode.gain.value = value;
  } 
}