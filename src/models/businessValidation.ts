export class BusinessValidation {
	private _message: string;
	private _code?: string;

	constructor(params: { code?: string; message: string } | string) {
		if (typeof params === 'string') {
			this._message = params;
		} else {
			this._message = params.message;
			this._code = params.code;
		}
	}

	public get message(): string {
		return this._message;
	}

	public get code(): string | undefined {
		return this._code;
	}

	public toString(): string {
		if (this._code) {
			return `[${this._code}] ${this._message}`;
		}
		return this._message;
	}
}
