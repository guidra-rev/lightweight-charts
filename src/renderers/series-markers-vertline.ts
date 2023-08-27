import { Coordinate } from '../model/coordinate';
import { drawHorizontalLine, drawVerticalLine } from './draw-line';

export function drawVertLine(
	ctx: CanvasRenderingContext2D,
	centerX: Coordinate,
	centerY: Coordinate,
	size: number,
	color: string
): void {
	ctx.lineWidth = size;
	ctx.strokeStyle = color;
	drawVerticalLine(ctx, centerX, 0, ctx.canvas.height);
}


export function drawHorizLine(ctx: CanvasRenderingContext2D,
	y: number,
	left: number,
	right: number,
	size: number,
	color: string): void {

	ctx.lineWidth = size;
	ctx.strokeStyle = color;

	drawHorizontalLine(ctx, y, left, right);
}
