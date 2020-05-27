import { groupByKey, groupByKeyLastValue } from "../collections";
import { TableBodyElement } from "k6/html";

describe("Test collection tool", () => {
	const values = [
		{ k: 0, v: '-' },
		{ k: 0, v: 'a' },
		{ k: 0, v: 'b' },
		{ k: 0, v: 'c' },
		{ k: 1, v: 'd' },
		{ k: 2, v: 'e' },
		{ k: 2, v: 'f' },
	];

	it("Should group by key", () => {
		const result = groupByKey(values, v => v.k);

		expect(result.size).toBe(3);
		expect(result.get(0).length).toBe(4);
		expect(result.get(1).length).toBe(1);
		expect(result.get(2).length).toBe(2);
	});

	it("Should group by key last value", () => {
		const result = groupByKeyLastValue(values, v => v.k);

		expect(result.size).toBe(3);
		expect(result.get(0).v).toBe('c');
		expect(result.get(1).v).toBe('d');
		expect(result.get(2).v).toBe('f');
	});

	it("Should return empty map when undefined collection - group by key", () => {
		const result = groupByKey(null, () => { });
		expect(result.size).toBe(0);
	});

	it("Should return empty map when undefined collection - group by key last value", () => {
		const result = groupByKeyLastValue(null, () => { });
		expect(result.size).toBe(0);
	});
});
