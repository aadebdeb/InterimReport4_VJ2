import { RenderTarget } from '../renderTargets/renderTarget';
import { GBuffer } from '../core/gBuffer';
import { Camera } from '../cameras/camera';

export type FilterOptions = {
  gBuffer?: GBuffer,
  camera?: Camera,
}

export interface Filter {
  active: boolean;
  apply(gl: WebGL2RenderingContext, src: RenderTarget, dst: RenderTarget): void;
}