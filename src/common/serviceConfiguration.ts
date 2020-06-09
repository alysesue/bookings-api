import { Service } from "../models";
import { InRequestScope } from "typescript-ioc";

@InRequestScope
export class ServiceConfiguration {
	public service?: Service;

	public getServiceId(): number {
		return this.service?.id;
	}
}
