export class BusinessValidation {
	public _message: string;
	public get message(): string { return this._message; }

	constructor(message: string) {
		this._message = message;
	}
}
