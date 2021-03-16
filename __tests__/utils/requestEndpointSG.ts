import * as request from 'request';
import * as requestPromise from 'request-promise-native';
import * as setCookieParser from 'set-cookie-parser';

class RequestEndpointSG {
	private _headers: { [e: string]: string };

	constructor() {
		this._headers = {};
	}

	private async apiRequest(options: { method: string; uri: string; body: any; qs: any }): Promise<request.Response> {
		const BASE_URL = process.env['FUNCTIONAL_TEST_BASE_URL'];
		let response: request.Response;

		try {
			await requestPromise({
				baseUrl: BASE_URL,
				json: true,
				headers: this._headers,
				...options,
				callback: (_error: any, _response: request.Response) => {
					response = _response;
				},
			});

			return response;
		} catch (error) {
			if (response) {
				// tslint:disable-next-line: no-console
				console.log(`${error.name}\n Request: ${JSON.stringify(options)}\n Response: ${error.message}`);

				return response;
			} else {
				throw error;
			}
		}
	}

	public getHeader = () => this._headers;

	public setHeaders = (headerObject: { [e: string]: string }) => {
		Object.keys(headerObject).forEach((key) => {
			this._headers[key] = headerObject[key];
		});
		return this;
	};

	public async get(
		path: string,
		data?: {
			params?: object;
			body?: any;
		},
	): Promise<request.Response> {
		return await this.apiRequest({ method: 'GET', uri: path, qs: data?.params, body: data?.body });
	}

	public async post(
		path: string,
		data?: {
			params?: object;
			body?: any;
		},
	): Promise<request.Response> {
		return await this.apiRequest({ method: 'POST', uri: path, qs: data?.params, body: data?.body });
	}

	public async put(
		path: string,
		data?: {
			params?: object;
			body?: any;
		},
	): Promise<request.Response> {
		return await this.apiRequest({ method: 'PUT', uri: path, qs: data?.params, body: data?.body });
	}

	public async delete(
		path: string,
		data?: {
			params?: object;
			body?: any;
		},
	): Promise<request.Response> {
		return await this.apiRequest({ method: 'DELETE', uri: path, qs: data?.params, body: data?.body });
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

const TOKEN_COOKIE = 'BookingSGToken';

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
			cookie: '',
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
	public static create = ({
		citizenUinFin,
		serviceId,
	}: {
		citizenUinFin?: string;
		serviceId?: string;
	}): CitizenRequestEndpointSG => {
		const apiService = serviceId ? { 'x-api-service': serviceId } : {};
		const headers = {
			'mol-user-id': 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			'mol-user-uinfin': citizenUinFin || 'S7429377H',
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

export class AnonmymousEndpointSG extends RequestEndpointSG {
	public static create = async ({ serviceId }: { serviceId?: string } = {}): Promise<AnonmymousEndpointSG> => {
		const apiService = serviceId ? { 'x-api-service': serviceId } : {};
		const sessionResponse = await AnonmymousEndpointSG.postAnonymousSession();
		const cookieValue = AnonmymousEndpointSG.parseBookingSGCookie(sessionResponse);

		const headers = {
			...apiService,
			cookie: `${TOKEN_COOKIE}=${cookieValue}`,
		};
		return new AnonmymousEndpointSG(headers);
	};

	public static async postAnonymousSession(): Promise<request.Response> {
		const anonymousSessionRequest = new RequestEndpointSG();
		return await anonymousSessionRequest.post('/usersessions/anonymous');
	}

	public static parseBookingSGCookie(response: request.Response): string {
		for (const cookieString of response.headers['set-cookie']) {
			const splitCookieHeaders = setCookieParser.splitCookiesString(cookieString);
			const parsedCookies = setCookieParser.parse(splitCookieHeaders, {
				decodeValues: false,
			});

			// tslint:disable-next-line: tsr-detect-possible-timing-attacks
			if (parsedCookies.length > 0 && parsedCookies[0].name === TOKEN_COOKIE) {
				return parsedCookies[0].value;
			}
		}
	}

	private constructor(headers: { [e: string]: string }) {
		super();
		this.setHeaders(headers);
	}
}
