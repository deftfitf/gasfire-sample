import {SKRSContext2D as SSContext2D} from "@napi-rs/canvas";
import {mat4} from "gl-matrix";
import {BezierFire} from "@/render/gasfire/bezierfire";
import {drawRect} from "@/render/gasfire/utils";


export type TransformTemplate = {
  src: number[][],
  dest: number[][]
}

// Refer to: https://yaju3d.hatenablog.jp/entry/2013/09/12/010917
export class ProjectiveTransform {
  template: TransformTemplate;
  mat: number[];

  constructor(template: TransformTemplate, transformMatrix: number[]) {
    this.template = template;
    this.mat = transformMatrix;
  }

  /**
   * Transforms the given coordinates using the transformation matrix.
   *
   * @param {number} _x - The x-coordinate.
   * @param {number} _y - The y-coordinate.
   * @returns {number[]} - The transformed coordinates [x, y].
   */
  transform = (_x: number, _y: number): number[] => {
    const z = _x * this.mat[6] + _y * this.mat[7] + this.mat[8];
    const x = (_x * this.mat[0] + _y * this.mat[1] + this.mat[2]) / z;
    const y = (_x * this.mat[3] + _y * this.mat[4] + this.mat[5]) / z;
    return [x, y];
  }

  /**
   * Transforms a BezierFire object by applying a transformation to its coordinates.
   *
   * @param {BezierFire} bezierLine - The BezierFire object to transform.
   * @returns {BezierFire} - The transformed BezierFire object.
   */
  transformBezier = (bezierLine: BezierFire): BezierFire => {
    const [sx, sy] = this.transform(bezierLine.start.x, bezierLine.start.y);
    const [fbx, fby] = this.transform(bezierLine.fireBase.x, bezierLine.fireBase.y);

    const points = bezierLine.points.map(point => {
      const [cp1x, cp1y] = this.transform(point.cp1x, point.cp1y);
      const [cp2x, cp2y] = this.transform(point.cp2x, point.cp2y);
      const [x, y] = this.transform(point.x, point.y);
      return {cp1x, cp1y, cp2x, cp2y, x, y}
    });

    return new BezierFire(bezierLine.frame, {x: sx, y: sy}, points, {x: fbx, y: fby})
  }

  /**
   * Creates a new ProjectiveTransform instance using the provided template.
   *
   * @param {TransformTemplate} template - The template containing source and destination points for the transformation.
   * @return {ProjectiveTransform} - A new instance of ProjectiveTransform.
   */
  static createTransformBy(template: TransformTemplate): ProjectiveTransform {
    const projectionMatrix = calcProjectionMatrix(template.src, template.dest);
    return new ProjectiveTransform(template, projectionMatrix);
  }

  /**
   * Visualize function is responsible for drawing rectangles on the canvas context.
   *
   * @param {SSContext2D | CanvasRenderingContext2D} ctx - The context to draw on.
   * @returns {void}
   */
  visualize = (ctx: SSContext2D | CanvasRenderingContext2D) => {
    drawRect(ctx, this.template.src);
    drawRect(ctx, [...this.template.src.map(point => this.transform(point[0], point[1]))]);
  }
}

/**
 * Calculates the projection matrix based on the source and destination coordinates.
 *
 * @param {number[][]} src - The source coordinates.
 * @param {number[][]} dest - The destination coordinates.
 * @return {number[]} - The projection matrix.
 */
function calcProjectionMatrix(src: number[][], dest: number[][]): number[] {
  function Z(val: number): number {
    return val == 0 ? 0.5 : val;
  }

  const X1 = Z(src[0][0]);
  const X2 = Z(src[1][0]);
  const X3 = Z(src[2][0]);
  const X4 = Z(src[3][0]);
  const Y1 = Z(src[0][1]);
  const Y2 = Z(src[1][1]);
  const Y3 = Z(src[2][1]);
  const Y4 = Z(src[3][1]);
  const x1 = Z(dest[0][0]);
  const x2 = Z(dest[1][0]);
  const x3 = Z(dest[2][0]);
  const x4 = Z(dest[3][0]);
  const y1 = Z(dest[0][1]);
  const y2 = Z(dest[1][1]);
  const y3 = Z(dest[2][1]);
  const y4 = Z(dest[3][1]);

  //X point
  const tx = mat4.fromValues(
      X1, Y1, -X1 * x1, -Y1 * x1,
      X2, Y2, -X2 * x2, -Y2 * x2,
      X3, Y3, -X3 * x3, -Y3 * x3,
      X4, Y4, -X4 * x4, -Y4 * x4
  )

  mat4.invert(tx, tx);
  const kx1 = tx[0] * x1 + tx[1] * x2 + tx[2] * x3 + tx[3] * x4;
  const kc1 = tx[0] + tx[1] + tx[2] + tx[3];
  const kx2 = tx[4] * x1 + tx[5] * x2 + tx[6] * x3 + tx[7] * x4;
  const kc2 = tx[4] + tx[5] + tx[6] + tx[7];
  const kx3 = tx[8] * x1 + tx[9] * x2 + tx[10] * x3 + tx[11] * x4;
  const kc3 = tx[8] + tx[9] + tx[10] + tx[11];
  const kx4 = tx[12] * x1 + tx[13] * x2 + tx[14] * x3 + tx[15] * x4;
  const kc4 = tx[12] + tx[13] + tx[14] + tx[15];

  //Y point
  const ty = mat4.fromValues(
      X1, Y1, -X1 * y1, -Y1 * y1,
      X2, Y2, -X2 * y2, -Y2 * y2,
      X3, Y3, -X3 * y3, -Y3 * y3,
      X4, Y4, -X4 * y4, -Y4 * y4
  );

  mat4.invert(ty, ty);
  const ky1 = ty[0] * y1 + ty[1] * y2 + ty[2] * y3 + ty[3] * y4;
  const kf1 = ty[0] + ty[1] + ty[2] + ty[3];
  const ky2 = ty[4] * y1 + ty[5] * y2 + ty[6] * y3 + ty[7] * y4;
  const kf2 = ty[4] + ty[5] + ty[6] + ty[7];
  const ky3 = ty[8] * y1 + ty[9] * y2 + ty[10] * y3 + ty[11] * y4;
  const kf3 = ty[8] + ty[9] + ty[10] + ty[11];
  const ky4 = ty[12] * y1 + ty[13] * y2 + ty[14] * y3 + ty[15] * y4;
  const kf4 = ty[12] + ty[13] + ty[14] + ty[15];
  let det_1 = kc3 * (-kf4) - (-kf3) * kc4;

  if (det_1 == 0) {
    det_1 = 0.0001;
  }
  det_1 = 1 / det_1;
  const param: number[] = new Array(9);
  const C = (-kf4 * det_1) * (kx3 - ky3) + (kf3 * det_1) * (kx4 - ky4);
  const F = (-kc4 * det_1) * (kx3 - ky3) + (kc3 * det_1) * (kx4 - ky4);
  param[2] = C;
  param[5] = F;
  param[6] = kx3 - C * kc3;
  param[7] = kx4 - C * kc4;
  param[0] = kx1 - C * kc1;
  param[1] = kx2 - C * kc2;
  param[3] = ky1 - F * kf1;
  param[4] = ky2 - F * kf2;
  param[8] = 1;

  return param;
}
