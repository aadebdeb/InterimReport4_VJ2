import { Camera } from './camera';
import { Vector3 } from '../math/vector3';
import { Matrix4 } from '../math/matrix4';

export class PerspectiveCamera implements Camera {
  private _position: Vector3 | null = null;
  private _modelMatrix: Matrix4 | null = null;
  private _viewMatrix: Matrix4 | null = null;
  private _projMatrix: Matrix4;
  private _vpMatrix: Matrix4 | null = null;

  constructor(readonly aspect: number, readonly vfov: number, readonly near: number, readonly far: number) {
    this._projMatrix = Matrix4.perspective(aspect, vfov, near, far);
  }

  lookAt(position: Vector3, target: Vector3, up: Vector3): PerspectiveCamera {
    this._position = position.clone();
    this._modelMatrix = Matrix4.lookAt(position, target, up);
    this._viewMatrix = this._modelMatrix.getInvMatrix();
    this._vpMatrix = Matrix4.mul(this.viewMatrix, this._projMatrix);
    return this;
  }

  get position(): Vector3 {
    if (this._position == null) {
      throw Error('camera position is not set.');
    }
    return this._position.clone();
  }

  get modelMatrix(): Matrix4 {
    if (this._modelMatrix == null) {
      throw Error('camera position is not set.');
    }
    return this._modelMatrix;
  }

  get viewMatrix(): Matrix4 {
    if (this._viewMatrix == null) {
      throw Error('camera position is not set.');
    }
    return this._viewMatrix;
  }

  get projMatrix(): Matrix4 {
    return this._projMatrix;
  }

  get vpMatrix(): Matrix4 {
    if (this._vpMatrix == null) {
      throw Error('camera position is not set.');
    }
    return this._vpMatrix;
  }
}