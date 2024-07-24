import {XorShift} from "@/render/gasfire/xorshift";
import {ProjectiveTransform} from "@/render/gasfire/projection";
import {BezierFire, Point, Rect} from "@/render/gasfire/bezierfire";
import {SKRSContext2D as SSContext2D} from '@napi-rs/canvas';
import {drawArc, drawRect} from "@/render/gasfire/utils";

/**
 * Represents a projection generator for creating projective transforms.
 */
export class ProjectionGenerator {
  private xorShift: XorShift;
  private seed: BezierFire;
  private readonly canvasWidth: number;

  constructor(xorShift: XorShift, seed: BezierFire, canvasWidth: number) {
    this.xorShift = xorShift;
    this.seed = seed;
    this.canvasWidth = canvasWidth;
  }

  private degreeToRad(degree: number) {
    return degree * Math.PI / 180;
  }

  /**
   * Determines the center point within a given range of motion.
   *
   * @param {Rect} barRangeOfMotion - The rectangular range of motion within which the center point is determined.
   * @returns {Point} - The calculated center point.
   */
  private determineCenterPoint = (barRangeOfMotion: Rect): Point => {
    const midpointX = this.xorShift.nextIntBet(barRangeOfMotion.x1, barRangeOfMotion.x2);
    const midpointY = this.xorShift.nextIntBet(barRangeOfMotion.y1, barRangeOfMotion.y2);

    return {x: midpointX, y: midpointY};
  }

  /**
   * Calculates the range of angles for a bar based on the midpoint coordinates.
   * @param {number} midpointX - The x-coordinate of the midpoint.
   * @param {number} midpointY - The y-coordinate of the midpoint.
   * @returns {number[]} An array containing the start and end angles in radians.
   */
  private calcBarAngleRange = (midpointX: number, midpointY: number): number[] => {
    let startAngle: number;
    let endAngle: number;
    if (midpointX < this.seed.frame.x1) {
      startAngle = -(Math.PI - Math.atan((midpointY - this.seed.frame.y2) / (midpointX - this.seed.frame.x1)));
      endAngle = Math.atan((midpointY - this.seed.frame.y2) / (midpointX - this.seed.frame.x2));
    } else if (
        midpointX >= this.seed.frame.x1 &&
        midpointX <= this.seed.frame.x2
    ) {
      startAngle = Math.atan((midpointY - this.seed.frame.y2) / (midpointX - this.seed.frame.x1));
      endAngle = Math.atan((midpointY - this.seed.frame.y2) / (midpointX - this.seed.frame.x2));
    } else {
      startAngle = Math.atan((midpointY - this.seed.frame.y2) / (midpointX - this.seed.frame.x1));
      endAngle = Math.PI + Math.atan((midpointY - this.seed.frame.y2) / (midpointX - this.seed.frame.x2));
    }

    const angleThreshold = 30;
    return [
      startAngle + this.degreeToRad(angleThreshold),
      endAngle - this.degreeToRad(angleThreshold)];
  }

  /**
   * Determines the bar angle in radians based on the start and end angles.
   * @param startAngle - The starting angle in radians.
   * @param endAngle - The ending angle in radians.
   * @returns The bar angle in radians.
   */
  private determineBarAngleRad = (startAngle: number, endAngle: number): number => {
    const lr = this.xorShift.nextIntBet(0, 1);
    const angleWidth = (endAngle - startAngle) * 180 / Math.PI;
    const angleMove = this.xorShift.nextIntBet(0, angleWidth) * Math.PI / 180;
    let angleRad = startAngle + angleMove;
    if (lr == 1) {
      return angleRad + Math.PI;
    }
    return angleRad;
  }

  /**
   * Function to rotate a point around a center point by a given angle in radians.
   *
   * @param {number} centerX - The x-coordinate of the center point.
   * @param {number} centerY - The y-coordinate of the center point.
   * @param {Point} point - The point to be rotated.
   * @param {number} radian - The angle in radians by which to rotate the point.
   * @returns {Point} - The rotated point.
   */
  private rotate = (centerX: number, centerY: number, point: Point, radian: number): Point => {
    const cosTheta = Math.cos(radian);
    const sinTheta = Math.sin(radian);

    return {
      x: centerX + (point.x - centerX) * cosTheta - (point.y - centerY) * sinTheta,
      y: centerY + (point.x - centerX) * sinTheta + (point.y - centerY) * cosTheta,
    }
  }

  /**
   * Transforms the coordinates of the seed frame to create a projective transform based on a bar shape.
   *
   * @param {SSContext2D|CanvasRenderingContext2D} ctx - Optional. The rendering context used for debugging.
   * @returns {ProjectiveTransform} - The projective transform generated based on the bar shape.
   */
  nextTransform(ctx?: SSContext2D | CanvasRenderingContext2D): ProjectiveTransform {
    const minWidth = 51;
    const frameWidth = this.seed.frame.x2 - this.seed.frame.x1;
    const frameHeight = this.seed.frame.y2 - this.seed.frame.y1;
    const barLength = Math.floor(this.xorShift.nextIntBet(minWidth, frameWidth) / 2) * 2;
    const radius = barLength / 2;

    const barRangeOfMotion: Rect = {
      x1: radius,
      y1: radius,
      x2: this.canvasWidth - radius,
      y2: this.seed.frame.y1 + frameHeight / 2
    }

    const {x: midpointX, y: midpointY} = this.determineCenterPoint(barRangeOfMotion);
    const [startAngle, endAngle] = this.calcBarAngleRange(midpointX, midpointY);
    const barAngleRad = this.determineBarAngleRad(startAngle, endAngle);

    const baseLeftTopPoint = {x: midpointX - radius, y: midpointY};
    const baseRightTopPoint = {x: midpointX + radius, y: midpointY};
    const {x: x1, y: y1} = this.rotate(midpointX, midpointY, baseLeftTopPoint, barAngleRad);
    const {x: x2, y: y2} = this.rotate(midpointX, midpointY, baseRightTopPoint, barAngleRad);

    // For debug usage
    if (ctx) {
      console.log('startAngle: ', startAngle * 180 / Math.PI);
      console.log('endAngle: ', endAngle * 180 / Math.PI);
      console.log('angle: ', barAngleRad * 180 / Math.PI);

      drawRect(ctx, [
        [barRangeOfMotion.x1, barRangeOfMotion.y1],
        [barRangeOfMotion.x2, barRangeOfMotion.y1],
        [barRangeOfMotion.x2, barRangeOfMotion.y2],
        [barRangeOfMotion.x1, barRangeOfMotion.y2],
      ]);

      drawArc(ctx, midpointX, midpointY, radius, startAngle, endAngle);
      drawArc(ctx, midpointX, midpointY, radius, startAngle + Math.PI, endAngle + Math.PI);
    }

    return ProjectiveTransform.createTransformBy({
      src: [
        [this.seed.frame.x1, this.seed.frame.y1],
        [this.seed.frame.x2, this.seed.frame.y1],
        [this.seed.frame.x2, this.seed.frame.y2],
        [this.seed.frame.x1, this.seed.frame.y2],
      ],
      dest: [
        [x1, y1],
        [x2, y2],
        [this.seed.frame.x2, this.seed.frame.y2],
        [this.seed.frame.x1, this.seed.frame.y2],
      ],
    });
  }

  /**
   * Creates a new projection generator object based on the provided parameters.
   *
   * @param {string} address - The address used to generate a deterministic random number sequence.
   * @param {BezierFire} seed - The seed object used to generate the projection.
   * @param {number} canvasWidth - The width of the canvas used for the projection.
   * @returns {ProjectionGenerator} A new instance of the ProjectionGenerator class.
   */
  static createBy(xorShift: XorShift, seed: BezierFire, canvasWidth: number): ProjectionGenerator {

    return new ProjectionGenerator(xorShift, seed, canvasWidth);
  }
}