import { LineStyle } from "../renderers/draw-line";

/**
 * Represents the position of a series marker relative to a bar.
 */
export type SeriesMarkerPosition = 'aboveBar' | 'belowBar' | 'inBar';

/**
 * Represents the shape of a series marker.
 */
export type SeriesMarkerShape = 'circle' | 'square' | 'arrowUp' | 'arrowDown' | 'vertLine';

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
	 * The ID of the marker.
	 */
	id?: string;
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
	/**
	 * @internal
	 */
	originalTime1: unknown;
	/**
	 * @internal
	 */
	originalTime2: unknown;
}

export interface InternalSeriesMarker<TimeType> extends SeriesMarker<TimeType> {
	internalId: number;
}

export interface InternalSeriesHorizLine<TimeType> extends SeriesHorizLine<TimeType> {
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

export function convertSeriesHorizLine<InTimeType, OutTimeType>(
	sm: SeriesHorizLine<InTimeType>,
	newTime1: OutTimeType,
	newTime2: OutTimeType,
	originalTime1?: unknown,
	originalTime2?: unknown): SeriesHorizLine<OutTimeType> {

	const { time1: inTime1,
		originalTime1: inOriginalTime1,
		time2: inTime2,
		originalTime2: inOriginalTime2,
		...values } = sm;

	/* eslint-disable @typescript-eslint/consistent-type-assertions */
	const res = {
		time1: newTime1,
		time2: newTime2,
		...values,
	} as SeriesHorizLine<OutTimeType>;

	/* eslint-enable @typescript-eslint/consistent-type-assertions */
	if (originalTime1 !== undefined) {
		res.originalTime1 = originalTime1;
	}

	if (originalTime2 !== undefined) {
		res.originalTime2 = originalTime2;
	}
	return res;
}