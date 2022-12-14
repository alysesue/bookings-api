import * as moment from 'moment';
import 'moment-timezone';

export const keepTimeFromTimezoneToLocal = (options: { date: any; format: string }): string => {
	const tzDate = moment(options.date).tz('Asia/Singapore');
	return tzDate.tz(moment.tz.guess(), true).format(options.format);
};
