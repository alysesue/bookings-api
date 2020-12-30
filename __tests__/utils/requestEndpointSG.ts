import { RequestEndpoint } from 'mol-lib-common';
import * as request from 'request';

class RequestEndpointSG {
	private _requestEndpoint: RequestEndpoint;

	constructor() {
		const BASE_URL = process.env['FUNCTIONAL_TEST_BASE_URL'];
		this._requestEndpoint = new RequestEndpoint();
		this._requestEndpoint.setOptions({
			baseUrl: BASE_URL,
			json: true,
		});
	}

	public setHeaders = (headerObject: { [e: string]: string }) => {
		Object.keys(headerObject).forEach((key) => {
			this._requestEndpoint.setHeader(key, headerObject[key]);
		});
		return this;
	};

	public get(
		path: string,
		data?: {
			params?: object;
			body?: any;
		},
	): Promise<request.Response> {
		return this._requestEndpoint.get(path, data);
	}

	public post(
		path: string,
		data?: {
			params?: object;
			body?: any;
		},
	): Promise<request.Response> {
		return this._requestEndpoint.post(path, data);
	}

	public put(
		path: string,
		data?: {
			params?: object;
			body?: any;
		},
	): Promise<request.Response> {
		return this._requestEndpoint.put(path, data);
	}

	public delete(
		path: string,
		data?: {
			params?: object;
			body?: any;
		},
	): Promise<request.Response> {
		return this._requestEndpoint.delete(path, data);
	}
}

const ADMIN_HEADERS = {
	'mol-token-bypass': 'true',
	'mol-auth-type': 'ADMIN',
};

const CITIZEN_HEADERS = {
	'mol-token-bypass': 'true',
	'mol-auth-type': 'USER',
};

export class OrganisationAdminRequestEndpointSG extends RequestEndpointSG {
	public static create = ({
		organisation = 'localorg',
		nameService = 'admin',
		serviceId,
	}: {
		organisation?: string;
		nameService?: string;
		serviceId?: string;
	}): OrganisationAdminRequestEndpointSG => {
		const apiService = serviceId ? { 'x-api-service': serviceId } : {};
		const headers = {
			'mol-admin-email': `${nameService}@palo-it.com`,
			'mol-admin-groups': `bookingsg:org-admin:${organisation}`,
			'mol-admin-id': `ce6d2f24-3913-11eb-adc1-0242ac120002`,
			'mol-admin-name': `${nameService} The Admin`,
			'mol-admin-username': `${nameService}User`,
			...apiService,
		};
		return new OrganisationAdminRequestEndpointSG(headers);
	};

	private constructor(headers: { [e: string]: string }) {
		super();
		this.setHeaders({
			...ADMIN_HEADERS,
			...headers,
		});
	}
}

export class ServiceAdminRequestEndpointSG extends RequestEndpointSG {
	public static create = ({
		organisation = 'localorg',
		nameService = 'admin',
		serviceId,
	}: {
		organisation?: string;
		nameService?: string;
		serviceId?: string;
	}): ServiceAdminRequestEndpointSG => {
		const apiService = serviceId ? { 'x-api-service': serviceId } : {};
		const headers = {
			'mol-admin-email': `${nameService}@palo-it.com`,
			'mol-admin-groups': `bookingsg:svc-admin-${nameService}:${organisation}`,
			'mol-admin-id': `b8ef2f6c-3913-11eb-adc1-0242ac120002`,
			'mol-admin-name': `${nameService} The Admin`,
			'mol-admin-username': `${nameService}User`,
			...apiService,
		};
		return new ServiceAdminRequestEndpointSG(headers);
	};
	private constructor(headers: { [e: string]: string }) {
		super();
		this.setHeaders({
			...ADMIN_HEADERS,
			...headers,
		});
	}
}
export class ServiceProviderRequestEndpointSG extends RequestEndpointSG {
	public static create = ({
		organisation = 'localorg',
		nameService = 'admin',
		serviceId,
		molAdminId = 'e20a41ba-390f-11eb-adc1-0242ac120002',
	}: {
		organisation?: string;
		nameService?: string;
		serviceId?: string;
		molAdminId?: string;
	}): ServiceProviderRequestEndpointSG => {
		const apiService = serviceId ? { 'x-api-service': serviceId } : {};
		const headers = {
			'mol-admin-email': `${nameService}@palo-it.com`,
			'mol-admin-groups': `bookingsg:service-provider:${organisation}`,
			'mol-admin-id': molAdminId,
			'mol-admin-name': `${nameService} The Admin`,
			'mol-admin-username': `${nameService}User`,
			...apiService,
		};
		return new ServiceProviderRequestEndpointSG(headers);
	};

	private constructor(headers: { [e: string]: string }) {
		super();
		this.setHeaders({
			...ADMIN_HEADERS,
			...headers,
		});
	}
}

export class CitizenRequestEndpointSG extends RequestEndpointSG {
	public static create = ({ serviceId }: { serviceId?: string }): CitizenRequestEndpointSG => {
		const apiService = serviceId ? { 'x-api-service': serviceId } : {};
		const headers = {
			'mol-user-id': 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			'mol-user-uinfin': 'S7429377H',
			'mol-user-auth-level': '2',
			'mol-auth-type': 'USER',
			...apiService,
		};
		return new CitizenRequestEndpointSG(headers);
	};

	private constructor(headers: { [e: string]: string }) {
		super();
		this.setHeaders({
			...CITIZEN_HEADERS,
			...headers,
		});
	}
}
