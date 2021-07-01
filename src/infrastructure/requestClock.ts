import { Container, InRequestScope } from 'typescript-ioc';

export abstract class RequestClock {
	abstract requestTime(): Date;
}

@InRequestScope
class RequestClockInternal extends RequestClock {
	private readonly _requestTime: Date;
	constructor() {
		super();
		this._requestTime = new Date();
	}

	public requestTime(): Date {
		return this._requestTime;
	}
}

export function registerRequestClock(): void {
	Container.bind(RequestClock).to(RequestClockInternal);
}
