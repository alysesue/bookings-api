import * as sanitizeHtml from 'sanitize-html';

export const cleanHtml = (dirtyString: string): string => {
	// First replace Grave Accent character with single quote character, to cover the scenario of Grave Accent Obfuscation XSS attack.
	// This way it will be caught in the sanitizing process.
	const newString = dirtyString.replace(/\`/g, "'");

	const allowedTags = ['ins', 'del', 'img', 'br', 'iframe'];
	const allowedAttributes = {
		a: ['href', 'name', 'target'],
		img: ['src', 'alt', 'style', 'auth'],
		p: ['style'],
		span: ['style'],
		iframe: ['width', 'height', 'src', 'frameBorder'],
	};

	const sanitizedString = sanitizeHtml(newString, {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat(allowedTags),
		allowedAttributes,
	});
	return sanitizedString;
};
