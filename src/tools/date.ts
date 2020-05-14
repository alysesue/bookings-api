import moment = require("moment");
const TIME_FORMATS = ["HH:mm", "H:mm", "HH:m", "H:m"];

const parseTime = (time: string) => moment(time, TIME_FORMATS, true);

export const isValidFormatHHmm = (time: string) => {
	const parsed = parseTime(time);
	return parsed.isValid();
};

export const diffHours = (previous: string, after: string) => {
	const previousTime = parseTime(previous);
	const afterTime = parseTime(after);

	return afterTime.diff(previousTime, 'minutes');
};

export const parseHHmm = (time: string): { hours: number, minutes: number } => {
	if (time === null || time === undefined) {
		return null;
	}

	const parsed = parseTime(time);
	if (!parsed.isValid()) {
		throw new Error(`Value ${time} is not a valid time.`);
	}

	return { hours: parsed.hours(), minutes: parsed.minutes() };
};
