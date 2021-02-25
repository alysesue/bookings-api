import { StopWatch } from '../stopWatch';

function nothing(a) {
	return a;
}

function main() {
	const length = 50000;
	const middlePlusOneElement = `${Math.floor(1 + length / 2)}`;
	const arrStopWatch = new StopWatch('Array push');

	const arr = [];
	for (let i = 0; i < length; i++) {
		arr.push(`${i}`);
	}
	nothing(arr);
	arrStopWatch.stop();

	const setStopWatch = new StopWatch('Set add');
	// tslint:disable-next-line: no-unused-array
	const _set = new Set();
	for (let i = 0; i < length; i++) {
		_set.add(`${i}`);
	}
	nothing(_set);
	setStopWatch.stop();

	const includesStopWatch = new StopWatch('Array includes');
	let inc: boolean;
	for (let i = 0; i < length; i++) {
		inc = arr.includes(middlePlusOneElement);
	}
	nothing(inc);
	includesStopWatch.stop();

	const hasStopWatch = new StopWatch('Set has');
	let _has: boolean;
	for (let i = 0; i < length; i++) {
		_has = _set.has(middlePlusOneElement);
	}
	nothing(_has);
	hasStopWatch.stop();

	const arrayGetStopWatch = new StopWatch('Array get value');
	let value: any;
	for (let i = 0; i < length; i++) {
		value = arr[i];
		nothing(value);
	}
	nothing(value);
	arrayGetStopWatch.stop();

	const setGetStopWatch = new StopWatch('Set get value');
	for (const _v of _set) {
		nothing(_v);
	}
	setGetStopWatch.stop();
}

main();
