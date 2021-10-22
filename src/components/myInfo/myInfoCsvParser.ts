import { parseCsv } from '../../tools/csvParser';

export type MyInfoCsvEntry = { CODE: string; DESCRIPTION: string };

export const parseMyInfoCsv = (input: string | Buffer): readonly Readonly<MyInfoCsvEntry>[] => {
	const entries = parseCsv<MyInfoCsvEntry>(input);
	return Object.freeze(entries.map((e) => Object.freeze(e)));
};
