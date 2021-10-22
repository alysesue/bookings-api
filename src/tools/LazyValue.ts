export class LazyValue<T> {
	private _value: T;
	private _valueGetter: () => T;
	private _created: boolean;

	constructor(valueGetter: () => T) {
		this._created = false;
		this._valueGetter = valueGetter;
	}

	public getValue(): T {
		if (this._created) {
			return this._value;
		}

		this._value = this._valueGetter();
		this._created = true;
		return this._value;
	}
}
