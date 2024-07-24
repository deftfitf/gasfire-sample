import {SKRSContext2D as SSContext2D} from '@napi-rs/canvas';

export function drawRect(
    ctx: SSContext2D | CanvasRenderingContext2D,
    points: number[][]
) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  ctx.lineTo(points[1][0], points[1][1]);
  ctx.lineTo(points[2][0], points[2][1]);
  ctx.lineTo(points[3][0], points[3][1]);
  ctx.closePath();
  ctx.stroke();
}

export function drawArc(
    ctx: SSContext2D | CanvasRenderingContext2D,
    centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) {
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.stroke();
}