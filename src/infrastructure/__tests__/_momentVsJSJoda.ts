import { StopWatch } from '../stopWatch';
import * as moment from 'moment';
import { DateTimeFormatter, LocalTime } from '@js-joda/core';

const TIME_FORMATS = ['HH:mm', 'H:mm', 'HH:m', 'H:m', 'HH:mm:ss'];

const moment_parseTime = (time: string) => moment(time, TIME_FORMATS, true);

const jsJoda_formatter = DateTimeFormatter.ofPattern('H:m[:s]');
const jsjoda_parseTime = (time: string) => jsJoda_formatter.parse(time, LocalTime.FROM);

function nothing(a) {
	return a;
}

function main() {
	const length = 200000;

	const momentStopWatch = new StopWatch('Moment parse time');
	let parsed: any;
	for (let i = 0; i < length; i++) {
		parsed = moment_parseTime(`${8}:${30}`);
	}
	nothing(parsed);
	momentStopWatch.stop();

	const jsjodaStopWatch = new StopWatch('Js-joda parse time');
	for (let i = 0; i < length; i++) {
		parsed = jsjoda_parseTime(`${8}:${30}`);
	}
	nothing(parsed);
	jsjodaStopWatch.stop();
}

main();
