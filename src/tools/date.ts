// Format HH:mm
const TIME_FORMAT = "HH:mm";
import moment = require("moment");

export const isValidFormatHHmm = (time: string) => {
	const regex = new RegExp("^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$");
	return regex.test(time);

};

export const diffHours = (previous: string, after: string) => {
	const previousDate = moment('01/01/2011 ' + previous,'MM/DD/YYYY ' + TIME_FORMAT);
	const afterDate = moment('01/01/2011 ' + after, 'MM/DD/YYYY ' + TIME_FORMAT);
	return afterDate.diff(previousDate, 'minutes');
};