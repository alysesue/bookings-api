import { cleanHtml } from '../serviceNotificationTemplate.sanitizeHtml';

describe('sanitizeHtml of Services Notification Template service - test', () => {
	it('should sanitize script tag from string', () => {
		const clean = cleanHtml('<script>alert(1)</script>');
		expect(clean).toStrictEqual('');
	});

	it('should sanitize script tag from string - Extraneous Open Brackets', () => {
		const clean = cleanHtml('<<SCRIPT>alert("XSS");//\\<</SCRIPT>');
		expect(clean).toStrictEqual('&lt;');
	});

	it('should sanitize script tag after malformed IMG tags from string', () => {
		const clean = cleanHtml('<IMG """><SCRIPT>alert("XSS")</SCRIPT>">');
		expect(clean).toStrictEqual('<img />"&gt;');
	});

	it('should sanitize javascript commands from string', () => {
		const clean = cleanHtml('<IMG SRC="javascript:alert(\'XSS\');">');
		expect(clean).toStrictEqual('<img />');
	});

	it('should sanitize javascript commands from string - no quotes and no semicolon', () => {
		const clean = cleanHtml("<IMG SRC=javascript:alert('XSS')>");
		expect(clean).toStrictEqual('<img />');
	});

	it('should sanitize javascript commands from string - case insensitive', () => {
		const clean = cleanHtml("<IMG SRC=JaVaScRiPt:alert('XSS')>");
		expect(clean).toStrictEqual('<img />');
	});

	it('should sanitize javascript commands from string - HTML entities', () => {
		const clean = cleanHtml('<IMG SRC=javascript:alert(&quot;XSS&quot;)>');
		expect(clean).toStrictEqual('<img />');
	});

	it('should replace Grave Accent character with single quote character - Grave Accent Obfuscation', () => {
		const clean = cleanHtml("<IMG SRC=`javascript:alert('RSnakesays,'XSS'')`>");
		expect(clean).toStrictEqual("<img />");
	});

	it('should sanitize javascript commands from string - with embedded tab', () => {
		const clean = cleanHtml('<IMG SRC="jav	ascript:alert(\'XSS\');">');
		expect(clean).toStrictEqual('<img />');
	});

	it('should sanitize event handler even with malformed A tags, from string', () => {
		const clean = cleanHtml("<a onmouseover='alert(document.cookie)'>xxs link</a>");
		expect(clean).toStrictEqual('<a>xxs link</a>');
	});

	it('should sanitize decimal HTML character references from string', () => {
		const clean = cleanHtml(
			'<IMG SRC=&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;' +
				'&#58;&#97;&#108;&#101;&#114;&#116;&#40;&#39;&#88;&#83;&#83;&#39;&#41;>',
		);
		expect(clean).toStrictEqual('<img />');
	});

	it('should sanitize iframe from string', () => {
		const clean = cleanHtml('<iframe src=http://xss.rocks/scriptlet.html <');
		expect(clean).toStrictEqual('');
	});

	it('should sanitize input tag from string', () => {
		const clean = cleanHtml('<INPUT TYPE="IMAGE" SRC="javascript:alert(\'XSS\');">');
		expect(clean).toStrictEqual('');
	});

	it('should not remove typographical related tags: strong, em, ins, del, code, sup, sub', () => {
		const validString =
			'<p><strong>TEST</strong></p>\n' +
			'<p><em>TEST</em></p>\n' +
			'<p><ins>TEST</ins></p>\n' +
			'<p><del>TEST</del></p>\n' +
			'<p><code>TEST</code></p>\n' +
			'<p><sup>TEST</sup></p>\n' +
			'<p><sub>TEST</sub></p>\n';
		const clean = cleanHtml(validString);
		expect(clean).toStrictEqual(validString);
	});

	it('should not remove headings related tags: h, blockquote', () => {
		const validString =
			'<h1>TEST</h1>\n' +
			'<h2>TEST</h2>\n' +
			'<h3>TEST</h3>\n' +
			'<h4>TEST</h4>\n' +
			'<h5>TEST</h5>\n' +
			'<h6>TEST</h6>\n' +
			'<blockquote>TEST</blockquote>\n' +
			'<p>TEST</p>\n';
		const clean = cleanHtml(validString);
		expect(clean).toStrictEqual(validString);
	});

	it('should not remove font related tags', () => {
		const validString =
			'<p><span style="font-family:Arial">TEST</span></p>\n' +
			'<p><span style="font-family:Georgia">TEST</span></p>\n' +
			'<p><span style="font-family:Impact">TEST</span></p>\n' +
			'<p><span style="font-family:Tahoma">TEST</span></p>\n' +
			'<p><span style="font-family:Times New Roman">TEST</span></p>\n' +
			'<p><span style="font-family:Verdana">TEST</span></p>\n' +
			'<p><span style="color:rgb(50,50,50);background-color:rgb(255,255,255);font-size:16px;font-family:Lato, -apple-system, system-ui, sans-serif">TEST</span></p>\n';
		const clean = cleanHtml(validString);
		expect(clean).toStrictEqual(validString);
	});

	it('should not remove text-size related tags', () => {
		const validString =
			'<p><span style="font-size:10px">TEST</span></p>\n' +
			'<p><span style="font-size:12px">TEST</span></p>\n' +
			'<p><span style="font-size:16px">TEST</span></p>\n' +
			'<p><span style="font-size:24px">TEST</span></p>\n' +
			'<p><span style="font-size:36px">TEST</span></p>\n' +
			'<p><span style="font-size:60px">TEST</span></p>\n' +
			'<p><span style="font-size:96px">TEST</span></p>\n';
		const clean = cleanHtml(validString);
		expect(clean).toStrictEqual(validString);
	});

	it('should not remove list related tags', () => {
		const validString =
			'<ul>\n' +
			'<li>Test List 1</li>\n' +
			'<li>Test List 2</li>\n' +
			'</ul>\n' +
			'<ol>\n' +
			'<li>Test Ordered List 1</li>\n' +
			'<li>Test Ordered List 2</li>\n' +
			'</ol>\n';
		const clean = cleanHtml(validString);
		expect(clean).toStrictEqual(validString);
	});

	it('should not remove location related tags', () => {
		const validString =
			'<p>TEST</p>\n' +
			'<p style="text-align:center">TEST</p>\n' +
			'<p style="text-align:right">TEST</p>\n' +
			'<p style="text-align:justify">TEST</p>\n';
		const clean = cleanHtml(validString);
		expect(clean).toStrictEqual(validString);
	});

	it('should not remove url, images, colours and emojis related tags: a href, iframe, img, style, EXCEPT from frameBorder', () => {
		const validString =
			'<p><a href="https://www.palo-it.com/en/" target="_blank">Click here</a></p>\n' +
			'<p>Embedded Link:</p>\n' +
			'<iframe width="auto" height="auto" src="https://www.palo-it.com/en/" frameBorder="0"></iframe>\n' +
			'<p></p>\n' +
			'<p>😀 ⏰ 📅 ✅</p>\n' +
			'<p><span style="color:rgb(147,101,184)">Colored</span><br /><span style="background-color:rgb(147,101,184)">Highlighted</span></p>\n' +
			'<p></p>\n' +
			'<img src="https://cdn-images-1.medium.com/max/630/1*alhAqx64zla4MM067UiykA@2x.png" alt="undefined" style="height:auto;width:auto" />\n';
		const clean = cleanHtml(validString);
		expect(clean).toStrictEqual(validString.replace(' frameBorder="0"', ''));
	});
});
