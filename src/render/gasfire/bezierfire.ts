export type Point = {
  x: number, y: number,
}

export type Rect = {
  x1: number, y1: number,
  x2: number, y2: number,
}

export type BezierLine = {
  cp1x: number,
  cp1y: number,
  cp2x: number,
  cp2y: number,
  x: number,
  y: number,
}

/**
 * Represents a BezierFire object.
 */
export class BezierFire {
  frame: Rect;
  start: Point;
  points: BezierLine[];
  fireBase: Point;

  constructor(frame: Rect, start: Point, points: BezierLine[], fireBase: Point) {
    this.frame = frame;
    this.start = start;
    this.points = points;
    this.fireBase = fireBase;
  }

  /**
   * Calculates a point on a cubic Bézier curve given the time parameter.
   *
   * @param {number} t - The time parameter, ranging from 0 to 1.
   * @param {object} start - The starting point of the curve, with properties `x` and `y`.
   * @param {object} cp1 - The 1st control point of the curve, with properties `x` and `y`.
   * @param {object} cp2 - The 2nd control point of the curve, with properties `x` and `y`.
   * @param {object} end - The ending point of the curve, with properties `x` and `y`.
   * @returns {object} - The point on the curve at the given time parameter, with properties `x` and `y`.
   */
  private getBezierPoint = (
      t: number,
      start: { x: number, y: number },
      cp1: { x: number, y: number },
      cp2: { x: number, y: number },
      end: { x: number, y: number }
  ): { x: number, y: number } => {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    let p = { x: 0, y: 0 };

    p.x += start.x * uuu;
    p.x += 3 * cp1.x * uu * t;
    p.x += 3 * cp2.x * u * tt;
    p.x += end.x * ttt;

    p.y += start.y * uuu;
    p.y += 3 * cp1.y * uu * t;
    p.y += 3 * cp2.y * u * tt;
    p.y += end.y * ttt;

    return p;
  }

  /**
   * Calculates the approximate centroid of a Bézier curve.
   *
   * @param {number} [samples=10] - The number of points to sample on each segment of the Bézier curve.
   * @returns {{x: number, y: number}} - The approximate centroid, represented as an object with `x` and `y` coordinates.
   */
  calculateApproximateCentroid = (samples: number = 10): { x: number, y: number } => {
    let sumX = 0, sumY = 0;

    for (let i = 0; i < this.points.length; i++) {
      const p0 = i === 0 ? this.start : this.points[i - 1];
      const p1 = this.points[i];

      for (let j = 0; j < samples; j++) {
        const t = j / (samples - 1);
        const pt = this.getBezierPoint(t, p0, { x: p1.cp1x, y: p1.cp1y }, { x: p1.cp2x, y: p1.cp2y }, { x: p1.x, y: p1.y });

        sumX += pt.x;
        sumY += pt.y;
      }
    }

    return { x: sumX / (this.points.length * samples), y: sumY / (this.points.length * samples) };
  }

  /**
   * Applies a scaling transformation to the given bezier fire object.
   *
   * @param {number} centerX - The x-coordinate of the center point of the scaling operation.
   * @param {number} centerY - The y-coordinate of the center point of the scaling operation.
   * @param {number} scaleFactor - The scale factor to apply.
   * @returns {BezierFire} - The scaled bezier fire object.
   */
  scale = (centerX: number, centerY: number, scaleFactor: number): BezierFire => {
    const scaledPoints = this.points.map(point => {
      return {
        cp1x: centerX + (point.cp1x - centerX) * scaleFactor,
        cp1y: centerY + (point.cp1y - centerY) * scaleFactor,
        cp2x: centerX + (point.cp2x - centerX) * scaleFactor,
        cp2y: centerY + (point.cp2y - centerY) * scaleFactor,
        x: centerX + (point.x - centerX) * scaleFactor,
        y: centerY + (point.y - centerY) * scaleFactor,
      };
    });

    return new BezierFire(
        {
          x1: centerX + (this.frame.x1 - centerX) * scaleFactor,
          y1: centerY + (this.frame.y1 - centerY) * scaleFactor,
          x2: centerX + (this.frame.x2 - centerX) * scaleFactor,
          y2: centerY + (this.frame.y2 - centerY) * scaleFactor,
        },
        {
          x: centerX + (this.start.x - centerX) * scaleFactor,
          y: centerY + (this.start.y - centerY) * scaleFactor,
        },
        scaledPoints, {
          x: centerX + (this.fireBase.x - centerX) * scaleFactor,
          y: centerY + (this.fireBase.y - centerY) * scaleFactor,
        });
  }

  /**
   * Moves the BezierFire object by the specified offsetX and offsetY values.
   * @param {number} offsetX - The amount to move the BezierFire object in the x direction.
   * @param {number} offsetY - The amount to move the BezierFire object in the y direction.
   * @returns {BezierFire} - The new BezierFire object with the updated positions.
   */
  move = (offsetX: number, offsetY: number): BezierFire => {
    const scaledPoints = this.points.map(point => {
      return {
        cp1x: point.cp1x + offsetX,
        cp1y: point.cp1y + offsetY,
        cp2x: point.cp2x + offsetX,
        cp2y: point.cp2y + offsetY,
        x: point.x + offsetX,
        y: point.y + offsetY,
      };
    });

    return new BezierFire(
        {
          x1: this.frame.x1 + offsetX,
          y1: this.frame.y1 + offsetY,
          x2: this.frame.x2 + offsetX,
          y2: this.frame.y2 + offsetY,
        },{
          x: this.start.x + offsetX,
          y: this.start.y + offsetY,
        },
        scaledPoints, {
          x: this.fireBase.x + offsetX,
          y: this.fireBase.y + offsetY,
        });
  }
}