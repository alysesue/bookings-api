import { StopWatch } from '../stopWatch';

function nothing(a) {
	return a;
}

function setObj(obj: {}, key: any) {
	obj[key] = key;
}

function hasKey(obj: {}, key: any): boolean {
	return obj[key] !== undefined;
}

function mainB() {
	const length = 10000000;
	const middlePlusOneElement = BigInt(Math.floor(1 + length / 2));

	const objStopWatch = new StopWatch('Obj set prop');
	const obj = {};
	for (let i = 0; i < length; i++) {
		setObj(obj, BigInt(i));
	}
	nothing(obj);
	objStopWatch.stop();

	const mapStopWatch = new StopWatch('Map set entry');
	// tslint:disable-next-line: no-unused-array
	const _map = new Map();
	for (let i = 0; i < length; i++) {
		const key = BigInt(i);
		_map.set(key, key);
	}
	nothing(_map);
	mapStopWatch.stop();

	const hasPropStopWatch = new StopWatch('Obj has prop');
	let inc: boolean;
	for (let i = 0; i < length; i++) {
		inc = hasKey(obj, middlePlusOneElement);
	}
	nothing(inc);
	hasPropStopWatch.stop();

	const mapHasStopWatch = new StopWatch('Map has key');
	let _has: boolean;
	for (let i = 0; i < length; i++) {
		_has = _map.has(middlePlusOneElement);
	}
	nothing(_has);
	mapHasStopWatch.stop();
}

mainB();
