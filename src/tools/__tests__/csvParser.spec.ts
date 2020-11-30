import { readFileSync } from 'fs';
import { join } from 'path';
import { parseCsv } from '../csvParser';

describe('Utils', () => {
	it('should parse CSV', () => {
		const csvFile = readFileSync(join(__dirname, 'testdata.csv'));
		expect(csvFile).not.toBe(undefined);
		const records = parseCsv(csvFile);
		expect(records.length).toBe(2);
		// @ts-ignore
		expect(records[0].email).toBe('aaj');
	});
});
