import * as sanitizeHtml from 'sanitize-html';

describe('sanitizeHtml of Services Notification Template service - test', () => {
	const allowedTags = ['ins', 'del', 'img', '&nbsp;', 'br', 'iframe'];
	const allowedAttributes = {
		a: ['href', 'name', 'target'],
		img: ['src', 'alt', 'style', 'auth'],
		p: ['style'],
		span: ['style'],
		iframe:['width', 'height', 'src', 'frameBorder']
	};

	it('should sanitize script tag from string', async () => {
		const clean = sanitizeHtml('<script>alert(1)</script>');
		expect(clean).toStrictEqual('');
	});

	it('should not remove typographical related tags: strong, em, ins, del, code, sup, sub', async () => {
		const validString =
			'<p><strong>TEST</strong></p>\n' +
			'<p><em>TEST</em></p>\n' +
			'<p><ins>TEST</ins></p>\n' +
			'<p><del>TEST</del></p>\n' +
			'<p><code>TEST</code></p>\n' +
			'<p><sup>TEST</sup></p>\n' +
			'<p><sub>TEST</sub></p>\n';
		const clean = sanitizeHtml(validString, {
			allowedTags: sanitizeHtml.defaults.allowedTags.concat(allowedTags),
			allowedAttributes: allowedAttributes,
		});
		expect(clean).toStrictEqual(validString);
	});

	it('should not remove headings related tags: h, blockquote', async () => {
		const validString =
			'<h1>TEST</h1>\n' +
			'<h2>TEST</h2>\n' +
			'<h3>TEST</h3>\n' +
			'<h4>TEST</h4>\n' +
			'<h5>TEST</h5>\n' +
			'<h6>TEST</h6>\n' +
			'<blockquote>TEST</blockquote>\n' +
			'<p>TEST</p>\n';
		const clean = sanitizeHtml(validString, {
			allowedTags: sanitizeHtml.defaults.allowedTags.concat(allowedTags),
			allowedAttributes: allowedAttributes,
		});
		expect(clean).toStrictEqual(validString);
	});

	it('should not remove font related tags', async () => {
		const validString =
			'<p><span style="font-family:Arial">TEST</span></p>\n' +
			'<p><span style="font-family:Georgia">TEST</span></p>\n' +
			'<p><span style="font-family:Impact">TEST</span></p>\n' +
			'<p><span style="font-family:Tahoma">TEST</span></p>\n' +
			'<p><span style="font-family:Times New Roman">TEST</span></p>\n' +
			'<p><span style="font-family:Verdana">TEST</span></p>\n' +
			'<p><span style="color:rgb(50,50,50);background-color:rgb(255,255,255);font-size:16px;font-family:Lato, -apple-system, system-ui, sans-serif">TEST</span></p>\n';
		const clean = sanitizeHtml(validString, {
			allowedTags: sanitizeHtml.defaults.allowedTags.concat(allowedTags),
			allowedAttributes: allowedAttributes,
		});
		expect(clean).toStrictEqual(validString);
	});

	it('should not remove text-size related tags', async () => {
		const validString =
			'<p><span style="font-size:10px">TEST</span></p>\n' +
			'<p><span style="font-size:12px">TEST</span></p>\n' +
			'<p><span style="font-size:16px">TEST</span></p>\n' +
			'<p><span style="font-size:24px">TEST</span></p>\n' +
			'<p><span style="font-size:36px">TEST</span></p>\n' +
			'<p><span style="font-size:60px">TEST</span></p>\n' +
			'<p><span style="font-size:96px">TEST</span></p>\n';
		const clean = sanitizeHtml(validString, {
			allowedTags: sanitizeHtml.defaults.allowedTags.concat(allowedTags),
			allowedAttributes: allowedAttributes,
		});
		expect(clean).toStrictEqual(validString);
	});

	it('should not remove list related tags', async () => {
		const validString =
			'<ul>\n' +
			'<li>Test List 1</li>\n' +
			'<li>Test List 2</li>\n' +
			'</ul>\n' +
			'<ol>\n' +
			'<li>Test Ordered List 1</li>\n' +
			'<li>Test Ordered List 2</li>\n' +
			'</ol>\n';
		const clean = sanitizeHtml(validString, {
			allowedTags: sanitizeHtml.defaults.allowedTags.concat(allowedTags),
			allowedAttributes: allowedAttributes,
		});
		expect(clean).toStrictEqual(validString);
	});

	it('should not remove location related tags', async () => {
		const validString =
			'<p>TEST</p>\n' +
			'<p style="text-align:center">TEST</p>\n' +
			'<p style="text-align:right">TEST</p>\n' +
			'<p style="text-align:justify">TEST</p>\n';
		const clean = sanitizeHtml(validString, {
			allowedTags: sanitizeHtml.defaults.allowedTags.concat(allowedTags),
			allowedAttributes: allowedAttributes,
		});
		expect(clean).toStrictEqual(validString);
	});

	it('should not remove url, images, colours and emojis related tags: a href, iframe, img, style  ', async () => {
		const validString =
			'<p><a href="https://www.palo-it.com/en/" target="_blank">Click here</a>&nbsp;</p>\n' +
			'<p>Embedded Link:</p>\n' +
			'<iframe width="auto" height="auto" src="https://www.palo-it.com/en/" frameBorder="0"></iframe>\n' +
			'<p></p>\n' +
			'<p>😀 ⏰ 📅 ✅</p>\n' +
			'<p><span style="color:rgb(147,101,184)">Colored</span><br><span style="background-color:rgb(147,101,184)">Highlighted</span></p>\n' +
			'<p></p>\n' +
			'<img src="https://cdn-images-1.medium.com/max/630/1*alhAqx64zla4MM067UiykA@2x.png" alt="undefined" style="height:auto;width:auto"/>\n';
		const clean = sanitizeHtml(validString, {
			allowedTags: sanitizeHtml.defaults.allowedTags.concat(allowedTags),
			allowedAttributes: allowedAttributes,
		});
		expect(clean).toStrictEqual(validString);
	});
});
