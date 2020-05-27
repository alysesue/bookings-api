import * as parse from 'csv-parse/lib/sync'

import { readFileSync } from 'fs';
import { join } from 'path';


describe("Utils", () => {
	it('should parse CSV', () => {
		const csvFile = readFileSync(join(__dirname, 'testdata.csv'));
		expect(csvFile).not.toBe(undefined);
		const records = parse(csvFile, {
			columns: true,
			skip_empty_lines: true
		});
		expect(records.length).toBe(4);
	});
});
