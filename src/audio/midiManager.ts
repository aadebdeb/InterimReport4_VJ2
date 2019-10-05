export class MidiManager {
  private initialized: boolean = false;
  private eventMap: Map<string, (value: number) => void>;
  constructor(eventMap: Map<[number, number], (value: number) => void>) {
    this.eventMap = new Map();
    for (let [key, value] of eventMap) {
      this.eventMap.set(`${key[0]}${key[1]}`, value);
    }
  }

  async initialize() {
    if (this.initialized) {
      return;
    }
    try {
      const midi = await navigator.requestMIDIAccess();
      midi.inputs.forEach(device => {
        device.addEventListener('midimessage', (e: any) => { // TODO: fix later
          const key = `${e.data[0]}${e.data[1]}`;
          const callback = this.eventMap.get(key);
          if (callback) {
            callback(e.data[2] / 127.0);
          }
        })
      })
      this.initialized = true;
    } catch (e) {
      throw new Error('MIDI not supported.');
    }
  }
}