import { Compression } from '../compression';

describe('Test compression file', () => {
	it('Should compress and decompress JSON an object with an efficiency more than 55%', () => {
		const data = {
			serviceId: '120-235-23',
			serviceProvider: '2304-230034-3',
			name: 'Very long name for very important people, but maybe not too long',
			startAt: '1613963836022',
			endAt: '16139632342998',
			email: 'veryLongEmail-ILikeLongEmail_alrightEmail@gmail.com',
			description:
				'Use caution when making use of Experimental features, particularly ' +
				'within modules. Users may not be aware that experimental features are being used.' +
				'Bugs or behavior changes may surprise users when Experimental API modifications occur. ' +
				'To avoid surprises, use of an Experimental feature may need a command-line flag. ' +
				'Experimental features may also emit a warning.',
			otherLongDescription:
				'Singapore (/ˈ(About this soundlisten)), officially the Republic of Singapore, is a sovereign island city-state in maritime Southeast Asia. ' +
				'It lies about one degree of latitude (137 kilometres or 85 miles) north of the equator, off the southern tip of the Malay Peninsula, bordering the Straits ' +
				"of Malacca to the west, the Riau Islands (Indonesia) to the south, and the South China Sea to the east. The country's territory is composed of one main island," +
				" 63 satellite islands and islets, and one outlying islet, the combined area of which has increased by 25% since the country's independence as a result of " +
				'extensive land reclamation projects. It has the second greatest population density in the world. The country has almost 5.7 million residents, 61% (3.4 million) ' +
				'of whom are Singaporean citizens. There are four official languages of Singapore: English, Malay, Chinese and Tamil, with English being the lingua franca. ' +
				'Multiracialism is enshrined in the constitution, and continues to shape national policies in education, housing, and politics.',
			location:
				'1 Geylang Serai bonus long address too ahah damn that really an unpractical address, Singapore 402001',
			phone: '+664929494',
			urlback: 'https:www.best-Url-Ever/super-path',
			urlRedirect:
				'https://www.worsturlever.com/we-like-real-long-path-because-is-not-convenient/#free-inconvienent-url',
		};
		const stringJsonData = JSON.stringify(data);
		const buffData = Buffer.from(stringJsonData, 'utf8');
		const compressed = Compression.compress(buffData);
		const decompressed = Compression.decompress(compressed);
		expect(stringJsonData.length).toBeGreaterThan(2000);
		expect(compressed.length).toBeLessThan(850);
		expect(((compressed.length - stringJsonData.length) / stringJsonData.length) * 100).toBeLessThan(-55);
		expect(JSON.parse(decompressed.toString('utf8'))).toStrictEqual(data);
	});
});
