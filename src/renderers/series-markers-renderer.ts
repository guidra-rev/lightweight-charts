import { MediaCoordinatesRenderingScope } from 'fancy-canvas';

import { ensureNever } from '../helpers/assertions';
import { makeFont } from '../helpers/make-font';

import { HoveredObject } from '../model/chart-model';
import { Coordinate } from '../model/coordinate';
import { SeriesMarkerShape } from '../model/series-markers';
import { TextWidthCache } from '../model/text-width-cache';
import { SeriesItemsIndexesRange, TimePointIndex, TimedValue } from '../model/time-data';

import { MediaCoordinatesPaneRenderer } from './media-coordinates-pane-renderer';
import { drawArrow, hitTestArrow } from './series-markers-arrow';
import { drawCircle, hitTestCircle } from './series-markers-circle';
import { drawSquare, hitTestSquare } from './series-markers-square';
import { drawText, hitTestText } from './series-markers-text';
import { drawHorizLine, drawVertLine } from './series-markers-vertline';
import { LineStyle } from './draw-line';

export interface SeriesMarkerText {
	content: string;
	x: Coordinate;
	y: Coordinate;
	width: number;
	height: number;
}

export interface SeriesMarkerRendererDataItem extends TimedValue {
	y: Coordinate;
	size: number;
	shape: SeriesMarkerShape;
	color: string;
	internalId: number;
	externalId?: string;
	text?: SeriesMarkerText;
	lineStyle: LineStyle;
}

export interface SeriesHorizLineRendererDataItem {
	time1?: TimePointIndex;
	time2?: TimePointIndex;
	x1: Coordinate;
	x2: Coordinate;
	y: Coordinate;
	size: number;
	color: string;
	textLeft?: SeriesMarkerText;
	textRight?: SeriesMarkerText;
	lineStyle: LineStyle;
}

export interface SeriesVertLineRendererDataItem {
	time: TimePointIndex;
	x: Coordinate;
	yHigh: Coordinate;
	yLow: Coordinate;
	size: number;
	color: string;
	lineStyle: LineStyle;
}

export interface SeriesRectangleRendererDataItem {
	xLeft: Coordinate;
	yTop: Coordinate;
	width: number;
	height: number;
	backgroundColor: string;
	borderColor?: string;
}

export interface SeriesMarkerRendererData {
	items: SeriesMarkerRendererDataItem[];
	visibleRange: SeriesItemsIndexesRange | null;
}

export interface SeriesHorizLineRendererData {
	items: SeriesHorizLineRendererDataItem[];
	visibleRange: number[];
}

export interface SeriesVertLineRendererData {
	items: SeriesVertLineRendererDataItem[];
	visibleRange: number[];
}

export interface SeriesRectangleRendererData {
	items: SeriesRectangleRendererDataItem[];
	visibleRange: number[];
}

export class SeriesMarkersRenderer extends MediaCoordinatesPaneRenderer {
	private _data: SeriesMarkerRendererData | null = null;
	private _dataHorizLines: SeriesHorizLineRendererData | null = null;
	private _dataVertLines: SeriesVertLineRendererData | null = null;
	private _dataRectangles: SeriesRectangleRendererData | null = null;
	private _textWidthCache: TextWidthCache = new TextWidthCache();
	private _fontSize: number = -1;
	private _fontFamily: string = '';
	private _font: string = '';

	public setDataMarkers(data: SeriesMarkerRendererData): void {
		this._data = data;
	}

	public setDataHorizLines(data: SeriesHorizLineRendererData): void {
		this._dataHorizLines = data;
	}

	public setDataVertLines(data: SeriesVertLineRendererData): void {
		this._dataVertLines = data;
	}

	public setDataRectangles(data: SeriesRectangleRendererData): void {
		this._dataRectangles = data;
	}

	public setParams(fontSize: number, fontFamily: string): void {
		if (this._fontSize !== fontSize || this._fontFamily !== fontFamily) {
			this._fontSize = fontSize;
			this._fontFamily = fontFamily;
			this._font = makeFont(fontSize, fontFamily);
			this._textWidthCache.reset();
		}
	}

	public hitTest(x: Coordinate, y: Coordinate): HoveredObject | null {
		if (this._data === null || this._data.visibleRange === null) {
			return null;
		}

		for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
			const item = this._data.items[i];
			if (hitTestItem(item, x, y)) {
				return {
					hitTestData: item.internalId,
					externalId: item.externalId,
				};
			}
		}

		return null;
	}

	private _drawImplMarkers(ctx: CanvasRenderingContext2D, isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null || this._data.visibleRange === null) {
			return;
		}

		ctx.textBaseline = 'middle';
		ctx.font = this._font;

		for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
			const item = this._data.items[i];
			if (item.text !== undefined) {
				item.text.width = this._textWidthCache.measureText(ctx, item.text.content);
				item.text.height = this._fontSize;
				item.text.x = item.x - item.text.width / 2 as Coordinate;
			}
			drawItem(item, ctx);
		}
	}

	private _drawImplVertLines(ctx: CanvasRenderingContext2D, isHovered: boolean, hitTestData?: unknown): void {
		if (this._dataVertLines === null || this._dataVertLines.visibleRange.length === 0) {
			return;
		}

		for (let i = 0; i < this._dataVertLines.items.length; i++) {
			if (!this._dataVertLines.visibleRange.includes(i))
				continue;

			const item = this._dataVertLines.items[i];

			drawVertLine(ctx, item.x, item.yHigh, item.yLow, item.size, item.color, item.lineStyle);
		}
	}

	private _drawImplHorizLines(ctx: CanvasRenderingContext2D, isHovered: boolean, hitTestData?: unknown): void {
		if (this._dataHorizLines === null || this._dataHorizLines.visibleRange.length === 0) {
			return;
		}

		ctx.textBaseline = 'middle';
		ctx.font = this._font;

		for (let i = 0; i < this._dataHorizLines.items.length; i++) {
			if (!this._dataHorizLines.visibleRange.includes(i))
				continue;

			const item = this._dataHorizLines.items[i];

			if (item.textLeft !== undefined && item.x1 !== 0) {
				item.textLeft.width = this._textWidthCache.measureText(ctx, item.textLeft.content);
				item.textLeft.height = this._fontSize;
				item.textLeft.x = item.x1;
				item.textLeft.y = item.y - 5 as Coordinate;
				ctx.fillStyle = item.color;
				drawText(ctx, item.textLeft.content, item.textLeft.x, item.textLeft.y);
			}

			if (item.textRight !== undefined && item.x2 !== 10000) {
				item.textRight.width = this._textWidthCache.measureText(ctx, item.textRight.content);
				item.textRight.height = this._fontSize;
				item.textRight.x = item.x2 - item.textRight.width as Coordinate;
				item.textRight.y = item.y - 5 as Coordinate;
				ctx.fillStyle = item.color;
				drawText(ctx, item.textRight.content, item.textRight.x, item.textRight.y);
			}

			drawHorizLine(ctx, item.y, item.x1, item.x2, item.size, item.color, item.lineStyle);
		}
	}

	private _drawImplRectangles(ctx: CanvasRenderingContext2D, isHovered: boolean, hitTestData?: unknown): void {
		if (this._dataRectangles === null || this._dataRectangles.visibleRange.length === 0) {
			return;
		}

		for (let i = 0; i < this._dataRectangles.items.length; i++) {
			if (!this._dataRectangles.visibleRange.includes(i))
				continue;

			const item = this._dataRectangles.items[i];

			// bg
			ctx.fillStyle = item.backgroundColor;
			ctx.fillRect(item.xLeft, item.yTop, item.width, item.height);

			// border
			if (item.borderColor !== undefined) {
				ctx.strokeStyle = item.borderColor;
				ctx.strokeRect(item.xLeft, item.yTop, item.width, item.height);
			}
		}
	}

	protected _drawImpl({ context: ctx }: MediaCoordinatesRenderingScope, isHovered: boolean, hitTestData?: unknown): void {
		this._drawImplMarkers(ctx, isHovered, hitTestData);
		this._drawImplVertLines(ctx, isHovered, hitTestData);
		this._drawImplRectangles(ctx, isHovered, hitTestData);
		this._drawImplHorizLines(ctx, isHovered, hitTestData);
	}
}

function drawItem(item: SeriesMarkerRendererDataItem, ctx: CanvasRenderingContext2D): void {
	ctx.fillStyle = item.color;

	if (item.text !== undefined) {
		drawText(ctx, item.text.content, item.text.x, item.text.y);
	}

	drawShape(item, ctx);
}

function drawShape(item: SeriesMarkerRendererDataItem, ctx: CanvasRenderingContext2D): void {
	if (item.size === 0) {
		return;
	}

	switch (item.shape) {
		case 'arrowDown':
			drawArrow(false, ctx, item.x, item.y, item.size);
			return;
		case 'arrowUp':
			drawArrow(true, ctx, item.x, item.y, item.size);
			return;
		case 'circle':
			drawCircle(ctx, item.x, item.y, item.size);
			return;
		case 'square':
			drawSquare(ctx, item.x, item.y, item.size);
			return;
	}

	ensureNever(item.shape);
}

function hitTestItem(item: SeriesMarkerRendererDataItem, x: Coordinate, y: Coordinate): boolean {
	if (item.text !== undefined && hitTestText(item.text.x, item.text.y, item.text.width, item.text.height, x, y)) {
		return true;
	}

	return hitTestShape(item, x, y);
}

function hitTestShape(item: SeriesMarkerRendererDataItem, x: Coordinate, y: Coordinate): boolean {
	if (item.size === 0) {
		return false;
	}

	switch (item.shape) {
		case 'arrowDown':
			return hitTestArrow(true, item.x, item.y, item.size, x, y);
		case 'arrowUp':
			return hitTestArrow(false, item.x, item.y, item.size, x, y);
		case 'circle':
			return hitTestCircle(item.x, item.y, item.size, x, y);
		case 'square':
			return hitTestSquare(item.x, item.y, item.size, x, y);
	}
}
