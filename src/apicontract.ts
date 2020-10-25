export class ErrorResponse {
	public message: string;

	constructor(message: string) {
		this.message = message;
	}
}

export class ApiData<T> {
	public data: T;
	constructor(typedData: T) {
		this.data = typedData;
	}
}

export class ApiDataFactory {
	private constructor() {}
	public static create<T>(data: T): ApiData<T> {
		return new ApiData(data);
	}
}
