import { LineStyle, drawHorizontalLine, drawVerticalLine, setLineStyle } from './draw-line';

export function drawVertLine(
	ctx: CanvasRenderingContext2D,
	x: number,
	top: number,
	bottom: number,
	size: number,
	color: string,
	lineStyle: LineStyle
): void {
	ctx.lineWidth = size;
	ctx.strokeStyle = color;
	setLineStyle(ctx, lineStyle);

	drawVerticalLine(ctx, x, top, bottom);
}


export function drawHorizLine(
	ctx: CanvasRenderingContext2D,
	y: number,
	left: number,
	right: number,
	size: number,
	color: string,
	lineStyle: LineStyle
): void {

	ctx.lineWidth = size;
	ctx.strokeStyle = color;
	setLineStyle(ctx, lineStyle);

	drawHorizontalLine(ctx, y, left, right);
}
