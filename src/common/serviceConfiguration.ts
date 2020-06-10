import { Service } from "../models";
import { InRequestScope } from "typescript-ioc";

@InRequestScope
export class ServiceConfiguration {
	private static _counter: number = 0;

	private _configId: number;
	public service?: Service;

	constructor() {
		this._configId = ServiceConfiguration._counter++;
	}

	public get configId(): number {
		return this._configId;
	}

	public getServiceId(): number {
		return this.service?.id;
	}
}
