import { MapProcessor } from '../mapProcessor';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('mapProcessor tests', () => {
	it('should call processor', () => {
		const map = new Map<number, string>();
		map.set(10, 'a');
		map.set(20, 'b');
		map.set(30, 'c');

		let counter = 0;

		const processor = new MapProcessor<number, string>(() => {
			counter++;
		});

		processor.process(map);
		expect(counter).toBe(3);
	});

	it('should throw when combining zero processors', () => {
		const test = () => {
			MapProcessor.combine();
		};

		expect(test).toThrowError('Cannot combine empty list of map processors.');
	});

	it('should combine single processor', () => {
		const map = new Map<number, string>();
		map.set(10, 'a');
		map.set(20, 'b');
		map.set(30, 'c');

		let counter = 0;

		const processor = new MapProcessor<number, string>(() => {
			counter++;
		});
		const combined = MapProcessor.combine(processor);

		combined.process(map);
		expect(counter).toBe(3);
	});

	it('should combine two processors', () => {
		const map = new Map<number, string>();
		map.set(10, 'a');
		map.set(20, 'b');
		map.set(30, 'c');

		let counter = 0;

		const processorA = new MapProcessor<number, string>(() => {
			counter++;
		});
		const processorB = new MapProcessor<number, string>(([key, entry]) => {
			map.set(key, `${entry}X`);
		});

		const combined = MapProcessor.combine(processorA, processorB);

		combined.process(map);
		expect(counter).toBe(3);
		expect(map.get(10)).toBe('aX');
	});

	it('should combine three processors', () => {
		const map = new Map<number, { str: string }>();
		map.set(10, { str: 'a' });
		map.set(20, { str: 'b' });
		map.set(30, { str: 'c' });

		let counter = 0;

		const processorA = new MapProcessor<number, { str: string }>(() => {
			counter++;
		});
		const processorB = new MapProcessor<number, { str: string }>(([_key, entry]) => {
			entry.str = `${entry.str}X`;
		});

		const processorC = new MapProcessor<number, { str: string }>(([_key, entry]) => {
			entry.str = `${entry.str}Y`;
		});

		const combined = MapProcessor.combine(processorA, processorB, processorC);

		combined.process(map);
		expect(counter).toBe(3);
		expect(map.get(10).str).toEqual('aXY');
	});
});
