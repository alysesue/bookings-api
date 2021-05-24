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

export class BusinessValidationTemplate<P> {
	private _templateMessage: (p: P) => string;
	private _code: string;

	constructor(params: { code: string; templateMessage: (p: P) => string }) {
		this._templateMessage = params.templateMessage;
		this._code = params.code;
	}

	public create(params: P): BusinessValidation {
		return new BusinessValidation({ code: this._code, message: this._templateMessage(params) });
	}
}
