import { ensureNever } from '../../helpers/assertions';
import { isNumber } from '../../helpers/strict-type-checks';

import { AutoScaleMargins } from '../../model/autoscale-info-impl';
import { BarPrice, BarPrices } from '../../model/bar';
import { IChartModelBase } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { PriceScale } from '../../model/price-scale';
import { ISeries } from '../../model/series';
import { InternalSeriesMarker, SeriesHorizLine, SeriesRectangle, SeriesText, SeriesVertLine } from '../../model/series-markers';
import { SeriesType } from '../../model/series-options';
import { TimePointIndex, visibleTimedValues } from '../../model/time-data';
import { ITimeScale } from '../../model/time-scale';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import {
	SeriesHorizLineRendererData,
	SeriesHorizLineRendererDataItem,
	SeriesMarkerRendererData,
	SeriesMarkerRendererDataItem,
	SeriesMarkersRenderer,
	SeriesRectangleRendererData,
	SeriesRectangleRendererDataItem,
	SeriesTextRendererData,
	SeriesTextRendererDataItem,
	SeriesVertLineRendererData,
	SeriesVertLineRendererDataItem,
} from '../../renderers/series-markers-renderer';
import {
	calculateShapeHeight,
	shapeMargin as calculateShapeMargin,
} from '../../renderers/series-markers-utils';

import { IUpdatablePaneView, UpdateType } from './iupdatable-pane-view';

const enum Constants {
	TextMargin = 0.1,
}

interface Offsets {
	aboveBar: number;
	belowBar: number;
}

// eslint-disable-next-line max-params
function fillSizeAndY(
	rendererItem: SeriesMarkerRendererDataItem,
	marker: InternalSeriesMarker<TimePointIndex>,
	seriesData: BarPrices | BarPrice,
	offsets: Offsets,
	textHeight: number,
	shapeMargin: number,
	priceScale: PriceScale,
	timeScale: ITimeScale,
	firstValue: number
): void {
	const inBarPrice = isNumber(seriesData) ? seriesData : seriesData.close;
	const highPrice = isNumber(seriesData) ? seriesData : seriesData.high;
	const lowPrice = isNumber(seriesData) ? seriesData : seriesData.low;
	const sizeMultiplier = isNumber(marker.size) ? Math.max(marker.size, 0) : 1;
	const shapeSize = calculateShapeHeight(timeScale.barSpacing()) * sizeMultiplier;
	const halfSize = shapeSize / 2;
	rendererItem.size = shapeSize;

	switch (marker.position) {
		case 'inBar': {
			rendererItem.y = priceScale.priceToCoordinate(inBarPrice, firstValue);
			if (rendererItem.text !== undefined) {
				rendererItem.text.y = rendererItem.y + halfSize + shapeMargin + textHeight * (0.5 + Constants.TextMargin) as Coordinate;
			}
			return;
		}
		case 'aboveBar': {
			rendererItem.y = (priceScale.priceToCoordinate(highPrice, firstValue) - halfSize - offsets.aboveBar) as Coordinate;
			if (rendererItem.text !== undefined) {
				rendererItem.text.y = rendererItem.y - halfSize - textHeight * (0.5 + Constants.TextMargin) as Coordinate;
				offsets.aboveBar += textHeight * (1 + 2 * Constants.TextMargin);
			}
			offsets.aboveBar += shapeSize + shapeMargin;
			return;
		}
		case 'belowBar': {
			rendererItem.y = (priceScale.priceToCoordinate(lowPrice, firstValue) + halfSize + offsets.belowBar) as Coordinate;
			if (rendererItem.text !== undefined) {
				rendererItem.text.y = rendererItem.y + halfSize + shapeMargin + textHeight * (0.5 + Constants.TextMargin) as Coordinate;
				offsets.belowBar += textHeight * (1 + 2 * Constants.TextMargin);
			}
			offsets.belowBar += shapeSize + shapeMargin;
			return;
		}
	}

	ensureNever(marker.position);
}

export class SeriesMarkersPaneView implements IUpdatablePaneView {
	private readonly _series: ISeries<SeriesType>;
	private readonly _model: IChartModelBase;

	private _dataMarkers: SeriesMarkerRendererData;
	private _dataHorizLines: SeriesHorizLineRendererData;
	private _dataVertLines: SeriesVertLineRendererData;
	private _dataRectangles: SeriesRectangleRendererData;
	private _dataText: SeriesTextRendererData;

	private _invalidated: boolean = true;
	private _dataInvalidatedMarkers: boolean = true;
	private _dataInvalidatedHorizLines: boolean = true;
	private _dataInvalidatedVertLines: boolean = true;
	private _dataInvalidatedRectangles: boolean = true;
	private _dataInvalidatedText: boolean = true;

	private _autoScaleMarginsInvalidated: boolean = true;

	private _autoScaleMargins: AutoScaleMargins | null = null;

	private _renderer: SeriesMarkersRenderer = new SeriesMarkersRenderer();

	public constructor(series: ISeries<SeriesType>, model: IChartModelBase) {
		this._series = series;
		this._model = model;
		this._dataMarkers = {
			items: [],
			visibleRange: null,
		};
		this._dataHorizLines = {
			items: [],
			visibleRange: [],
		};
		this._dataVertLines = {
			items: [],
			visibleRange: [],
		};
		this._dataRectangles = {
			items: [],
			visibleRange: [],
		};
		this._dataText = {
			items: [],
			visibleRange: [],
		};
	}

	public update(updateType?: UpdateType): void {
		this._invalidated = true;
		this._autoScaleMarginsInvalidated = true;

		if (updateType === 'data') {
			this._dataInvalidatedMarkers = true;
			this._dataInvalidatedHorizLines = true;
			this._dataInvalidatedVertLines = true;
			this._dataInvalidatedRectangles = true;
			this._dataInvalidatedText = true;
		}
	}

	public renderer(addAnchors?: boolean): IPaneRenderer | null {
		if (!this._series.visible()) {
			return null;
		}

		if (this._invalidated) {
			this._makeValid();
		}

		const layout = this._model.options().layout;
		this._renderer.setParams(layout.fontSize, layout.fontFamily);
		this._renderer.setDataMarkers(this._dataMarkers);
		this._renderer.setDataHorizLines(this._dataHorizLines);
		this._renderer.setDataVertLines(this._dataVertLines);
		this._renderer.setDataRectangles(this._dataRectangles);
		this._renderer.setText(this._dataText);

		return this._renderer;
	}

	public autoScaleMargins(): AutoScaleMargins | null {
		if (this._autoScaleMarginsInvalidated) {
			if (this._series.indexedMarkers().length > 0) {
				const barSpacing = this._model.timeScale().barSpacing();
				const shapeMargin = calculateShapeMargin(barSpacing);
				const marginsAboveAndBelow = calculateShapeHeight(barSpacing) * 1.5 + shapeMargin * 2;
				this._autoScaleMargins = {
					above: marginsAboveAndBelow as Coordinate,
					below: marginsAboveAndBelow as Coordinate,
				};
			} else {
				this._autoScaleMargins = null;
			}

			this._autoScaleMarginsInvalidated = false;
		}

		return this._autoScaleMargins;
	}

	private _makeValidMarkers(): void {
		const priceScale = this._series.priceScale();
		const timeScale = this._model.timeScale();
		const seriesMarkers = this._series.indexedMarkers();
		if (this._dataInvalidatedMarkers) {
			this._dataMarkers.items = seriesMarkers.map<SeriesMarkerRendererDataItem>((marker: InternalSeriesMarker<TimePointIndex>) => ({
				time: marker.time,
				x: 0 as Coordinate,
				y: 0 as Coordinate,
				size: 0,
				shape: marker.shape,
				color: marker.color,
				internalId: marker.internalId,
				externalId: marker.id,
				text: undefined
			}));
			this._dataInvalidatedMarkers = false;
		}

		const layoutOptions = this._model.options().layout;

		this._dataMarkers.visibleRange = null;
		const visibleBars = timeScale.visibleStrictRange();
		if (visibleBars === null) {
			return;
		}

		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return;
		}
		if (this._dataMarkers.items.length === 0) {
			return;
		}
		let prevTimeIndex = NaN;
		const shapeMargin = calculateShapeMargin(timeScale.barSpacing());
		const offsets: Offsets = {
			aboveBar: shapeMargin,
			belowBar: shapeMargin,
		};
		this._dataMarkers.visibleRange = visibleTimedValues(this._dataMarkers.items, visibleBars, true);
		for (let index = this._dataMarkers.visibleRange.from; index < this._dataMarkers.visibleRange.to; index++) {
			const marker = seriesMarkers[index];
			if (marker.time !== prevTimeIndex) {
				// new bar, reset stack counter
				offsets.aboveBar = shapeMargin;
				offsets.belowBar = shapeMargin;
				prevTimeIndex = marker.time;
			}

			const rendererItem = this._dataMarkers.items[index];
			rendererItem.x = timeScale.indexToCoordinate(marker.time);
			if (marker.text !== undefined && marker.text.length > 0) {
				rendererItem.text = {
					content: marker.text,
					x: 0 as Coordinate,
					y: 0 as Coordinate,
					width: 0,
					height: 0,
				};
			}
			const dataAt = this._series.dataAt(marker.time);
			if (dataAt === null) {
				continue;
			}
			fillSizeAndY(rendererItem, marker, dataAt, offsets, layoutOptions.fontSize, shapeMargin, priceScale, timeScale, firstValue.value);
		}
	}

	private _makeValidHorizLines(): void {
		const priceScale = this._series.priceScale();
		const timeScale = this._model.timeScale();
		const seriesHorizLines = this._series.indexedHorizLines();
		if (this._dataInvalidatedHorizLines) {
			this._dataHorizLines.items = seriesHorizLines.map<SeriesHorizLineRendererDataItem>((horizLine: SeriesHorizLine<TimePointIndex>) => ({
				time1: horizLine.time1,
				time2: horizLine.time2,
				x1: 0 as Coordinate,
				x2: 0 as Coordinate,
				y: 0 as Coordinate,
				size: 0,
				color: horizLine.color,
				textLeft: undefined,
				textRight: undefined,
				lineStyle: horizLine.lineStyle
			}));
			this._dataInvalidatedHorizLines = false;
		}

		// const layoutOptions = this._model.options().layout;

		this._dataHorizLines.visibleRange = [];
		const visibleBars = timeScale.visibleStrictRange();
		if (visibleBars === null) {
			return;
		}

		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return;
		}
		if (this._dataHorizLines.items.length === 0) {
			return;
		}

		for (let index = 0; index < this._dataHorizLines.items.length; index++) {
			const horizLine = seriesHorizLines[index];

			// don't render lignes outside of screen
			const tooFarLeft = horizLine.time2 !== undefined && horizLine.time2 < visibleBars.left();
			if (tooFarLeft)
				continue;

			const tooFarRight = horizLine.time1 !== undefined && horizLine.time1 > visibleBars.right();
			if (tooFarRight)
				continue;

			this._dataHorizLines.visibleRange.push(index);

			const rendererItem = this._dataHorizLines.items[index];

			rendererItem.x1 = 0 as Coordinate;
			if (horizLine.time1 !== undefined)
				rendererItem.x1 = timeScale.indexToCoordinate(horizLine.time1);

			rendererItem.x2 = 10000 as Coordinate;
			if (horizLine.time2 !== undefined)
				rendererItem.x2 = timeScale.indexToCoordinate(horizLine.time2);

			if (horizLine.textLeft !== undefined && horizLine.textLeft.length > 0) {
				rendererItem.textLeft = {
					content: horizLine.textLeft,
					x: 0 as Coordinate,
					y: 0 as Coordinate,
					width: 0,
					height: 0,
				};
			}

			if (horizLine.textRight !== undefined && horizLine.textRight.length > 0) {
				rendererItem.textRight = {
					content: horizLine.textRight,
					x: 0 as Coordinate,
					y: 0 as Coordinate,
					width: 0,
					height: 0,
				};
			}

			rendererItem.y = priceScale.priceToCoordinate(horizLine.price, firstValue.value);
		}
	}

	private _makeValidVertLines(): void {
		const priceScale = this._series.priceScale();
		const timeScale = this._model.timeScale();
		const seriesVertLines = this._series.indexedVertLines();
		if (this._dataInvalidatedVertLines) {
			this._dataVertLines.items = seriesVertLines.map<SeriesVertLineRendererDataItem>((vertLine: SeriesVertLine<TimePointIndex>) => ({
				time: vertLine.time,
				x: 0 as Coordinate,
				yHigh: 0 as Coordinate,
				yLow: 0 as Coordinate,
				size: 0,
				color: vertLine.color,
				lineStyle: vertLine.lineStyle
			}));
			this._dataInvalidatedVertLines = false;
		}

		// const layoutOptions = this._model.options().layout;

		this._dataVertLines.visibleRange = [];
		const visibleBars = timeScale.visibleStrictRange();
		if (visibleBars === null) {
			return;
		}

		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return;
		}
		if (this._dataVertLines.items.length === 0) {
			return;
		}

		for (let index = 0; index < this._dataVertLines.items.length; index++) {
			const vertLine = seriesVertLines[index];

			// don't render lignes outside of screen
			const tooFarLeft = vertLine.time < visibleBars.left();
			if (tooFarLeft)
				continue;

			const tooFarRight = vertLine.time > visibleBars.right();
			if (tooFarRight)
				continue;

			this._dataVertLines.visibleRange.push(index);

			const rendererItem = this._dataVertLines.items[index];

			rendererItem.x = timeScale.indexToCoordinate(vertLine.time);

			rendererItem.yHigh = 0 as Coordinate
			if (vertLine.priceHigh !== undefined) {
				rendererItem.yHigh = priceScale.priceToCoordinate(vertLine.priceHigh, firstValue.value);
			}

			rendererItem.yLow = 10000 as Coordinate
			if (vertLine.priceLow !== undefined) {
				rendererItem.yLow = priceScale.priceToCoordinate(vertLine.priceLow, firstValue.value);
			}
		}
	}

	private _makeValidRectangles(): void {
		const priceScale = this._series.priceScale();
		const timeScale = this._model.timeScale();
		const seriesRectangles = this._series.indexedRectangles();
		if (this._dataInvalidatedRectangles) {
			this._dataRectangles.items = seriesRectangles.map<SeriesRectangleRendererDataItem>((rectangle: SeriesRectangle<TimePointIndex>) => ({
				xLeft: 0 as Coordinate,
				yTop: 0 as Coordinate,
				width: 0 as number,
				height: 0 as number,
				backgroundColor: rectangle.backgroundColor,
				borderColor: rectangle.borderColor
			}));
			this._dataInvalidatedRectangles = false;
		}

		this._dataRectangles.visibleRange = [];
		const visibleBars = timeScale.visibleStrictRange();
		if (visibleBars === null) {
			return;
		}

		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return;
		}
		if (this._dataRectangles.items.length === 0) {
			return;
		}

		for (let index = 0; index < this._dataRectangles.items.length; index++) {
			const rectangle = seriesRectangles[index];

			// don't render if outside of screen
			const tooFarLeft = rectangle.time2 < visibleBars.left();
			if (tooFarLeft)
				continue;

			const tooFarRight = rectangle.time1 > visibleBars.right();
			if (tooFarRight)
				continue;

			this._dataRectangles.visibleRange.push(index);

			const rendererItem = this._dataRectangles.items[index];

			rendererItem.xLeft = timeScale.indexToCoordinate(rectangle.time1);
			const xRight = timeScale.indexToCoordinate(rectangle.time2);
			rendererItem.yTop = priceScale.priceToCoordinate(rectangle.priceTop, firstValue.value);
			const yBottom = priceScale.priceToCoordinate(rectangle.priceBot, firstValue.value);
			rendererItem.width = xRight - rendererItem.xLeft;
			rendererItem.height = yBottom - rendererItem.yTop;
		}
	}

	private _makeValidText(): void {
		const priceScale = this._series.priceScale();
		const timeScale = this._model.timeScale();
		const seriesText = this._series.indexedText();
		if (this._dataInvalidatedText) {
			this._dataText.items = seriesText.map<SeriesTextRendererDataItem>((text: SeriesText<TimePointIndex>) => ({
				time: text.time,
				price: text.price,
				x: 0 as Coordinate,
				y: 0 as Coordinate,
				text: text.text,
				font: text.font,
				color: text.color,
				textAlign: text.textAlign,
				textBaseline: text.textBaseline,
				maxWidth: text.maxWidth
			}));
			this._dataInvalidatedText = false;
		}

		this._dataText.visibleRange = [];
		const visibleBars = timeScale.visibleStrictRange();
		if (visibleBars === null) {
			return;
		}

		const firstValue = this._series.firstValue();
		if (firstValue === null) {
			return;
		}
		if (this._dataText.items.length === 0) {
			return;
		}

		for (let index = 0; index < this._dataText.items.length; index++) {
			const txt = seriesText[index];

			// don't render if outside of screen
			const tooFarLeft = txt.time < visibleBars.left();
			if (tooFarLeft)
				continue;

			const tooFarRight = txt.time > visibleBars.right();
			if (tooFarRight)
				continue;

			this._dataText.visibleRange.push(index);

			const rendererItem = this._dataText.items[index];

			rendererItem.x = timeScale.indexToCoordinate(txt.time);
			rendererItem.y = priceScale.priceToCoordinate(txt.price, firstValue.value);
		}
	}

	protected _makeValid(): void {
		this._makeValidMarkers();
		this._makeValidHorizLines();
		this._makeValidVertLines();
		this._makeValidRectangles();
		this._makeValidText();
		this._invalidated = false;
	}
}
