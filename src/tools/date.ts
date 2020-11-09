import * as moment from 'moment';
import { ParseTimeError } from '../errors/parseTimeError';

const TIME_FORMATS = ['HH:mm', 'H:mm', 'HH:m', 'H:m', 'HH:mm:ss'];

const parseTime = (time: string) => moment(time, TIME_FORMATS, true);

export const isValidFormatHHmm = (time: string) => {
	const parsed = parseTime(time);
	return parsed.isValid();
};

export const tryParseHHmm = (time: string): { isValid: boolean; hours: number; minutes: number } => {
	if (time === null || time === undefined || time.length === 0) {
		return null;
	}

	const parsed = parseTime(time);
	const isValid = parsed.isValid();
	return { isValid, hours: isValid ? parsed.hours() : null, minutes: isValid ? parsed.minutes() : null };
};

export const parseHHmm = (time: string): { hours: number; minutes: number } => {
	const result = tryParseHHmm(time);
	if (result === null) {
		return null;
	}

	const { isValid, hours, minutes } = result;
	if (!isValid) {
		throw new ParseTimeError(`Value ${time} is not a valid time.`);
	}

	return { hours, minutes };
};
