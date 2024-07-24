import {SKRSContext2D as SSContext2D} from "@napi-rs/canvas";
import {BezierFire} from "@/render/gasfire/bezierfire";
import {ProjectionGenerator} from "@/render/gasfire/generator";
import {XorShift} from "@/render/gasfire/xorshift";
import {checkTierOf, getTieredFireColor, TieredFireColor} from "@/render/gasfire/tier";

/**
 * Represents an array of BezierFire objects.
 */
const bezierFireSeeds: BezierFire[] = [
  new BezierFire(
      {x1: 120, y1: 70, x2: 392, y2: 512},
      {x: 134, y: 391},
      [
        {cp1x: 173, cp1y: 530, cp2x: 344, cp2y: 530, x: 383, y: 391},
        {cp1x: 406, cp1y: 260, cp2x: 282, cp2y: 221, x: 258, y: 70},
        {cp1x: 234, cp1y: 221, cp2x: 110, cp2y: 260, x: 134, y: 391}
      ],
      {x: 258, y: 406})
];

function drawBezierFire(
    ctx: SSContext2D | CanvasRenderingContext2D,
    bezierFire: BezierFire, fillColor: string | CanvasGradient
) {
  ctx.beginPath();
  ctx.moveTo(bezierFire.start.x, bezierFire.start.y);

  for (const point of bezierFire.points) {
    ctx.bezierCurveTo(point.cp1x, point.cp1y, point.cp2x, point.cp2y, point.x, point.y);
  }

  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
}

function drawBezierFrame(
    ctx: SSContext2D | CanvasRenderingContext2D,
    fireColor: TieredFireColor,
    bezierFires: BezierFire[]
) {
  const baseFire = bezierFires[0];

  for (let fire of bezierFires) {
    fire = fire.move(baseFire.fireBase.x - fire.fireBase.x, 0);
    const {x, y} = fire.calculateApproximateCentroid();
    drawBezierFire(ctx, fire.scale(x, y, 1.0), '#ffffff');
  }
  for (let fire of bezierFires) {
    fire = fire.move(baseFire.fireBase.x - fire.fireBase.x, 0);
    const {x, y} = fire.calculateApproximateCentroid();
    drawBezierFire(ctx, fire.scale(x, y, 0.93), '#000000');
  }
  for (let fire of bezierFires) {
    fire = fire.move(baseFire.fireBase.x - fire.fireBase.x, 0);
    const {x, y} = fire.calculateApproximateCentroid();
    drawBezierFire(ctx, fire.scale(x, y, 0.84), fireColor.outer);
  }

  for (let fire of bezierFires) {
    fire = fire.move(baseFire.fireBase.x - fire.fireBase.x, 0);
    drawBezierFire(ctx, fire.scale(fire.fireBase.x, fire.fireBase.y, 0.55), fireColor.middle);
  }

  drawBezierFire(ctx, baseFire.scale(baseFire.fireBase.x, baseFire.fireBase.y, 0.3), fireColor.inner);
}

export function renderImage(
    ctx: SSContext2D | CanvasRenderingContext2D,
    width: number, height: number,
    address: string, gasUsed: bigint
) {
  const xorShift = XorShift.getDeterministicRandomBy(address);

  const bezierFires: BezierFire[] = [];
  const fireNum = xorShift.nextIntBet(2, 4);
  for (let i = 0; i < fireNum; i++) {
    const seedIdx = xorShift.nextIntBet(0, bezierFireSeeds.length - 1);
    let fire = bezierFireSeeds[seedIdx];
    const generator = ProjectionGenerator.createBy(xorShift, fire, width);
    if (i > 0) {
      const projection = generator.nextTransform();
      fire = projection.transformBezier(fire);
    }
    bezierFires.push(fire);
  }

  const tier = checkTierOf(gasUsed);
  const tieredFireColor = getTieredFireColor(tier);
  drawBezierFrame(ctx, tieredFireColor, bezierFires);
}