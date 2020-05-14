import moment = require("moment");
const TIME_FORMAT = "HH:mm";

export const isValidFormatHHmm = (time: string) => {
	const parsed = moment(time, TIME_FORMAT);
	return parsed.isValid() && time.indexOf(':') > 0;
};

export const diffHours = (previous: string, after: string) => {
	const previousTime = moment(previous, TIME_FORMAT);
	const afterTime = moment(after, TIME_FORMAT);

	return afterTime.diff(previousTime, 'minutes');
};

export const parseHHmm = (time: string): { hours: number, minutes: number } => {
	if (time === null || time === undefined) {
		return null;
	}

	const parsed = moment(time, TIME_FORMAT);
	if (!parsed.isValid() && time.indexOf(':') > 0) {
		throw new Error(`Value ${time} is not a valid time.`);
	}

	return { hours: parsed.hours(), minutes: parsed.minutes() };
};
