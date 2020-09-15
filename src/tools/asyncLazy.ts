export class AsyncLazy<T> {
	private _value: T;
	private _valueGetter: () => Promise<T>;
	private _created: boolean;

	constructor(valueGetter: () => Promise<T>) {
		this._created = false;
		this._valueGetter = valueGetter;
	}

	public async getValue(): Promise<T> {
		if (this._created) {
			return this._value;
		}

		this._value = await this._valueGetter();
		this._created = true;
		return this._value;
	}
}
