import { StopWatch } from '../stopWatch';

function getKey(startDate: number, endDate: number) {
	return `${startDate}|${endDate}`;
}

function nothing(_) {
	return _;
}

function setObj(obj: {}, key: string) {
	obj[key] = key;
}

function hasKey(obj: {}, key: string): boolean {
	return obj[key] !== undefined;
}

function mainB() {
	const length = 5000000;
	const startValue = new Date().getMilliseconds();
	const middlePlusOneElementValue = Math.floor(1 + length / 2);

	const keyStopWatch = new StopWatch('create key');
	let mykey: string;
	for (let i = 0; i < length; i++) {
		mykey = getKey(startValue + i, startValue + i + 1000);
	}
	nothing(mykey);
	keyStopWatch.stop();

	const objStopWatch = new StopWatch('Obj set prop');
	const obj = {};
	for (let i = 0; i < length; i++) {
		const _key = getKey(startValue + i, startValue + i + 1000);
		setObj(obj, _key);
	}
	nothing(obj);
	objStopWatch.stop();

	const mapStopWatch = new StopWatch('Map set entry');
	// tslint:disable-next-line: no-unused-array
	const _map = new Map<string, any>();
	for (let i = 0; i < length; i++) {
		const _key = getKey(startValue + i, startValue + i + 1000);
		_map.set(_key, _key);
	}
	nothing(_map);
	mapStopWatch.stop();

	const hasPropStopWatch = new StopWatch('Obj has prop');
	let inc: boolean;
	for (let i = 0; i < length; i++) {
		const key = getKey(startValue + middlePlusOneElementValue, startValue + middlePlusOneElementValue + 1000);
		inc = hasKey(obj, key);
	}
	nothing(inc);
	hasPropStopWatch.stop();

	const mapHasStopWatch = new StopWatch('Map has key');
	let _has: boolean;
	for (let i = 0; i < length; i++) {
		const key = getKey(startValue + middlePlusOneElementValue, startValue + middlePlusOneElementValue + 1000);
		_has = _map.has(key);
	}
	nothing(_has);
	mapHasStopWatch.stop();
}

mainB();
