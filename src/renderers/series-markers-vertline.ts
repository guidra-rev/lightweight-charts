import { Coordinate } from '../model/coordinate';
import { drawVerticalLine } from './draw-line';

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
