export class BusinessValidation {
	constructor(message: string) {
		this._message = message;
	}

	public _message: string;

	public get message(): string {
		return this._message;
	}
}
