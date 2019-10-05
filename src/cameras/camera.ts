import { Vector3 } from 'src/math/vector3';
import { Matrix4 } from '../math/matrix4';

export interface Camera {
  readonly modelMatrix: Matrix4;
  readonly viewMatrix: Matrix4;
  readonly projMatrix: Matrix4;
  readonly vpMatrix: Matrix4;
  readonly position: Vector3;
  readonly near: number;
  readonly far: number;
  lookAt(position: Vector3, target: Vector3, up: Vector3): Camera;
}