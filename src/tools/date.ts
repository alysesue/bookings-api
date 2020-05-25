import * as moment from 'moment';

const TIME_FORMATS = ["HH:mm", "H:mm", "HH:m", "H:m", "HH:mm:ss"];

export const parseTime = (time: string) => moment(time, TIME_FORMATS, true);

export const isValidFormatHHmm = (time: string) => {
	const parsed = parseTime(time);
	return parsed.isValid();
};

export const parseHHmm = (time: string): { hours: number, minutes: number } => {
	if (time === null || time === undefined || time.length === 0) {
		return null;
	}

	const parsed = parseTime(time);
	if (!parsed.isValid()) {
		throw new Error(`Value ${time} is not a valid time.`);
	}

	return { hours: parsed.hours(), minutes: parsed.minutes() };
};
