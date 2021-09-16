import { DateTimeFormatter, LocalTime } from '@js-joda/core';
import { ParseTimeError } from '../errors/parseTimeError';

const jsJoda_formatter = DateTimeFormatter.ofPattern('H:m[:s]');
const parseTime = (time: string) => jsJoda_formatter.parse(time, LocalTime.FROM);

export const isValidFormatHHmm = (time: string): boolean => {
	try {
		parseTime(time);
		return true;
	} catch {
		return false;
	}
};

export const tryParseHHmm = (time: string): { isValid: boolean; hours: number; minutes: number } => {
	if (time === null || time === undefined || time.length === 0) {
		return null;
	}

	let parsed: LocalTime;
	try {
		parsed = parseTime(time);
	} catch {}
	const isValid = !!parsed;
	return { isValid, hours: isValid ? parsed.hour() : null, minutes: isValid ? parsed.minute() : null };
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

export const sortDate = (dates: Date[]) => {
	return dates.sort((a, b) => {
		return a.getTime() - b.getTime();
	});
};
