import { LineStyle } from "../renderers/draw-line";

/**
 * Represents the position of a series marker relative to a bar.
 */
export type SeriesMarkerPosition = 'aboveBar' | 'belowBar' | 'inBar';

/**
 * Represents the shape of a series marker.
 */
export type SeriesMarkerShape = 'circle' | 'square' | 'arrowUp' | 'arrowDown';

/**
 * Represents a series marker.
 */
export interface SeriesMarker<TimeType> {
	/**
	 * The time of the marker.
	 */
	time: TimeType;
	/**
	 * The position of the marker.
	 */
	position: SeriesMarkerPosition;
	/**
	 * The shape of the marker.
	 */
	shape: SeriesMarkerShape;
	/**
	 * The color of the marker.
	 */
	color: string;
	/**
	 * The ID of the marker.
	 */
	id?: string;
	/**
	 * The optional text of the marker.
	 */
	text?: string;
	/**
	 * The optional size of the marker.
	 *
	 * @defaultValue `1`
	 */
	size?: number;

	/**
	 * Style for vertical line
	 */
	lineStyle: LineStyle;

	/**
	 * @internal
	 */
	originalTime: unknown;
}

export interface SeriesHorizLine<TimeType> {
	/**
	 * The time of left point. If undefined, line is extended to the left
	 */
	time1?: TimeType;

	/**
	 * The time of right point. If undefined, line is extended to the right
	 */
	time2?: TimeType;
	/**
	 * The price of the line
	 */
	price: number;
	/**
	 * The color of the marker.
	 */
	color: string;
	/**
	 * The left text of the line.
	 */
	textLeft?: string;
	/**
	 * The right text of the line.
	 */
	textRight?: string;
	/**
	 * The optional size of the marker.
	 *
	 * @defaultValue `1`
	 */
	size?: number;
	/**
	 * Line style
	 */
	lineStyle: LineStyle;
}

export interface SeriesVertLine<TimeType> {
	/**
	 * The time of the line
	 */
	time: TimeType;

	/**
	 * Top price of the line, if undefined, it's extended
	 */
	priceHigh?: number;

	/**
	 * Low price of the line, if undefined, it's extended
	 */
	priceLow?: number;

	/**
	 * The color of the marker.
	 */
	color: string;
	/**
	 * The optional size of the line.
	 *
	 */
	size: number;
	/**
	 * Line style
	 */
	lineStyle: LineStyle;
}

export interface SeriesText<TimeType> {
	time: TimeType;
	price: number;
	text: string;
	color: string;
	font: string;
	textAlign: CanvasTextAlign;
	textBaseline: CanvasTextBaseline;
	maxWidth: number;
}

export interface SeriesRectangle<TimeType> {
	time1: TimeType;
	time2: TimeType;
	priceBot: number;
	priceTop: number;
	backgroundColor: string;
	borderColor?: string;
}

export interface SeriesText<TimeType> {
	time: TimeType;
	price: number;
	text: string;
	color: string;
	font: string;
	textAlign: CanvasTextAlign;
	textBaseline: CanvasTextBaseline;
	maxWidth: number;
}

export interface InternalSeriesMarker<TimeType> extends SeriesMarker<TimeType> {
	internalId: number;
}


export function convertSeriesMarker<InTimeType, OutTimeType>(sm: SeriesMarker<InTimeType>, newTime: OutTimeType, originalTime?: unknown): SeriesMarker<OutTimeType> {
	const { time: inTime, originalTime: inOriginalTime, ...values } = sm;
	/* eslint-disable @typescript-eslint/consistent-type-assertions */
	const res = {
		time: newTime,
		...values,
	} as SeriesMarker<OutTimeType>;
	/* eslint-enable @typescript-eslint/consistent-type-assertions */
	if (originalTime !== undefined) {
		res.originalTime = originalTime;
	}
	return res;
}