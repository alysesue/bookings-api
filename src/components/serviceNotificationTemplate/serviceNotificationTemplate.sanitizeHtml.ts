import * as sanitizeHtml from 'sanitize-html';

export const cleanHtml = (dirtyString: string): string => {
	const allowedTags = ['ins', 'del', 'img', 'br', 'iframe'];
	const allowedAttributes = {
		a: ['href', 'name', 'target'],
		img: ['src', 'alt', 'style', 'auth'],
		p: ['style'],
		span: ['style'],
		iframe: ['width', 'height', 'src', 'frameBorder'],
	};

	const sanitizedString = sanitizeHtml(dirtyString, {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat(allowedTags),
		allowedAttributes,
	});
	const cleanString = sanitizedString.replace('javascript', 'JS');
	return cleanString;
};
