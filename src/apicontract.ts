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
