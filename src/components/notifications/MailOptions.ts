export interface MailOptions {
	from?: string;
	to: string | string[];
	cc?: string | string[];
	bcc?: string | string[];
	subject: string;
	text?: string;
	html: string;
	attachments?: MailAttachment[];
}

export interface MailAttachment {
	filename?: string;
	content?: string;
	encoding?: string;
	path?: string;
}
