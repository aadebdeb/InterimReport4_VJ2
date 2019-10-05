import { Vector3 } from '../math/vector3';
import { Camera } from '../cameras/camera';

export class OrbitCameraController {
  private camera: Camera;
  private height: number = 0.0;
  private radius: number= 0.0;
  private phi: number = 0.0;
  private theta: number = 0.0;
  private phiSpeed: number = 0.0;
  private thetaSpeed: number = 0.0;
  constructor(camera: Camera) {
    this.camera = camera;
    this.reset();
  }

  reset() {
    this.theta = Math.random() * Math.PI * 2.0;
    this.phi = Math.random() * Math.PI * 2.0;
    this.thetaSpeed = 0.1;
    this.phiSpeed = 0.3;
    this.height = 10.0;
    this.radius = 10.0;
  }

  update(deltaSecs: number): void {
    this.theta += this.thetaSpeed * deltaSecs;
    this.phi += this.phiSpeed * deltaSecs;
    const pos = new Vector3(
      this.radius * Math.cos(this.phi),
      this.height * Math.sin(this.theta),
      this.radius * Math.sin(this.phi),
    );
    this.camera.lookAt(pos, Vector3.zero, new Vector3(0.0, 1.0, 0.0));
  }
}