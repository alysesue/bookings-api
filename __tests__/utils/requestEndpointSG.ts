import * as request from 'request';
import * as requestPromise from 'request-promise-native';
import * as setCookieParser from 'set-cookie-parser';

class RequestEndpointSG {
	private _headers: { [e: string]: string };
	private BASE_URL = {
		V1: process.env['FUNCTIONAL_TEST_BASE_URL_V1'],
		V2: process.env['FUNCTIONAL_TEST_BASE_URL_V2'],
	};

	constructor() {
		this._headers = {};
	}

	private async apiRequest(
		options: { method: string; uri: string; body: any; qs: any },
		baseUrl: string,
	): Promise<request.Response> {
		let response: request.Response;

		try {
			await requestPromise({
				baseUrl,
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
		version?: string,
	): Promise<request.Response> {
		return await this.apiRequest(
			{ method: 'GET', uri: path, qs: data?.params, body: data?.body },
			this.BASE_URL[version ?? 'V1'],
		);
	}

	public async post(
		path: string,
		data?: {
			params?: object;
			body?: any;
		},
		version?: string,
	): Promise<request.Response> {
		await this.csrfHandler(this.BASE_URL[version ?? 'V1'], path, data);
		return await this.apiRequest(
			{ method: 'POST', uri: path, qs: data?.params, body: data?.body },
			this.BASE_URL[version ?? 'V1'],
		);
	}

	public async put(
		path: string,
		data?: {
			params?: object;
			body?: any;
		},
		version?: string,
	): Promise<request.Response> {
		await this.csrfHandler(this.BASE_URL[version ?? 'V1'], path, data);
		return await this.apiRequest(
			{ method: 'PUT', uri: path, qs: data?.params, body: data?.body },
			this.BASE_URL[version ?? 'V1'],
		);
	}

	public async delete(
		path: string,
		data?: {
			params?: object;
			body?: any;
		},
		version?: string,
	): Promise<request.Response> {
		return await this.apiRequest(
			{ method: 'DELETE', uri: path, qs: data?.params, body: data?.body },
			this.BASE_URL[version ?? 'V1'],
		);
	}

	private async csrfHandler(
		baseUrl: string,
		path: string,
		data?: {
			params?: object;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			body?: any;
		},
	) {
		const res = await this.apiRequest({ method: 'HEAD', uri: path, qs: data?.params, body: undefined }, baseUrl);
		let cookie = this.getHeader().cookie ?? this.getHeader().Cookie ?? '';
		cookie += `; ${res.headers['set-cookie']}`;
		const csrf = res.headers['x-xsrf-token'] as string;
		this.setHeaders({ ['x-xsrf-token']: csrf, cookie });
	}
}

const AGENCY_HEADERS = {
	'mol-token-bypass': 'true',
	'mol-auth-type': 'AGENCY',
};

const ADMIN_HEADERS = {
	'mol-token-bypass': 'true',
	'mol-auth-type': 'ADMIN',
};

const CITIZEN_HEADERS = {
	'mol-token-bypass': 'true',
	'mol-auth-type': 'USER',
};

export const TOKEN_COOKIE = 'BookingSGToken';
export const OTP_COOKIE = 'MobileOtpAddOn';

export class AgencyRequestEndpointSG extends RequestEndpointSG {
	public static create = ({
		agencyAppId = 'agency-first-app',
		agencyName = 'localorg',
		serviceId,
	}: {
		agencyAppId?: string;
		agencyName?: string;
		organisation?: string;
		serviceId?: string;
	}): AgencyRequestEndpointSG => {
		const apiService = serviceId ? { 'x-api-service': serviceId.toString() } : {};
		const headers = {
			'mol-agency-app-id': agencyAppId,
			'mol-agency-name': agencyName,
			...apiService,
		};
		return new AgencyRequestEndpointSG(headers);
	};

	private constructor(headers: { [e: string]: string }) {
		super();
		this.setHeaders({
			...AGENCY_HEADERS,
			...headers,
		});
	}
}

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
		const cookieValue = AnonmymousEndpointSG.parseBookingSGCookie(sessionResponse, TOKEN_COOKIE);

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

	public static parseBookingSGCookie(response: request.Response, cookieName: string): string {
		for (const cookieString of response.headers['set-cookie']) {
			const splitCookieHeaders = setCookieParser.splitCookiesString(cookieString);
			const parsedCookies = setCookieParser.parse(splitCookieHeaders, {
				decodeValues: false,
			});

			// tslint:disable-next-line: tsr-detect-possible-timing-attacks
			if (parsedCookies.length > 0 && parsedCookies[0].name === cookieName) {
				return parsedCookies[0].value;
			}
		}

		return undefined;
	}

	public static async sendOTP(): Promise<string | undefined> {
		const endpoint = new RequestEndpointSG();
		const request = { mobileNo: '84000000', captchaToken: '' };

		const response = await endpoint.post('/otp/send', { body: request });
		return response.body?.data?.otpRequestId as string;
	}

	public static async verifyOTP(params: { otpRequestId: string; otpCode: string }): Promise<request.Response> {
		const endpoint = new RequestEndpointSG();
		const request = { ...params, captchaToken: '' };

		return await endpoint.post('/otp/verify', { body: request });
	}

	private constructor(headers: { [e: string]: string }) {
		super();
		this.setHeaders(headers);
	}

	public async sendAndVerifyOTP(): Promise<void> {
		const otpRequestId = await AnonmymousEndpointSG.sendOTP();
		if (!otpRequestId) {
			throw new Error('[AnonmymousEndpointSG]: Could not send otp');
		}
		const verifyResponse = await AnonmymousEndpointSG.verifyOTP({ otpRequestId, otpCode: '111111' });
		const cookieValue = AnonmymousEndpointSG.parseBookingSGCookie(verifyResponse, OTP_COOKIE);
		if (!cookieValue) {
			throw new Error('[AnonmymousEndpointSG]: Could not verify otp');
		}

		let headers = this.getHeader();
		headers = {
			...headers,
			cookie: `${headers['cookie']};${OTP_COOKIE}=${cookieValue}`,
		};

		this.setHeaders(headers);
	}
}
