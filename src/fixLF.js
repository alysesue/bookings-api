const fs = require('fs');
const { promisify } = require('util');
const globModule = require('glob');

const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const glob = promisify(globModule);

const counter = {
	read: 0,
	modified: []
};

function print(text) {
	// tslint:disable-next-line: no-console
	console.log('[LF tool]: ' + text)
}

async function fixFile(path) {
	if (!await exists(path)) {
		return
	}

	try {
		const contents = (await readFile(path)).toString();
		counter.read++;
		if (contents.match(/\r\n/)) {
			const replaced = contents.replace(/\r\n/g, '\n');

			counter.modified.push(path);
			await writeFile(path, replaced)
		}
	}
	catch(e){
		console.log('Error on file ', path);
		throw e;
	}
}

async function fixGlobPattern(pattern) {
	const files = await glob(pattern);
	const promises = files ? files.map(f => fixFile(f)) : [];
	await Promise.all(promises)
}

function main() {
	const promises = [
		fixGlobPattern('./src/**/*.sh'),
		fixGlobPattern('./src/**/*.js'),
		fixGlobPattern('./src/**/*.ts'),
		fixGlobPattern('./src/**/*.json'),
		fixGlobPattern('./scripts/**/*.sh'),
		fixGlobPattern('./scripts/**/*.js'),
		fixGlobPattern('./scripts/**/*.ts'),
		fixGlobPattern('./scripts/**/*.json'),
		fixGlobPattern('./__tests__/**/*.ts'),
		fixGlobPattern('./node_modules/mol-bamboo-scripts/**/*.sh'),
		fixGlobPattern('./node_modules/mol-bamboo-scripts/**/*.json'),
		fixGlobPattern('./node_modules/mol-lib-config/**/*.sh'),
		fixGlobPattern('./node_modules/mol-lib-config/**/*.json'),
	];

	Promise.all(promises).then(() => {
		counter.modified.forEach(f => print(f + ' ( CRLF -> LF )'));
		print(counter.read + ' file(s) inspected, ' + counter.modified.length + ' modified.')
	})
}

main();
