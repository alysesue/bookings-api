import {calendar_v3, google} from "googleapis";
import {Singleton} from "typescript-ioc";

const credentials = require("../config/googleapi-credentials.json");

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

@Singleton
export class GoogleApi {

	private _authToken: any = null;

	public setToken(token) {
		this._authToken = token;
	}

	public async getCalendarApi(): Promise<calendar_v3.Calendar> {
		const token = await this.getAuthToken();
		return new calendar_v3.Calendar({auth: token});
	}

	private async getAuthToken(): Promise<any> {
		const {client_email, private_key} = credentials;

		if (this._authToken === null) {
			const newToken = new google.auth.JWT(
				client_email,
				null,
				private_key,
				SCOPES
			);

			await this.testAuthorization(newToken);
			this.setToken(newToken);
		}

		return this._authToken;
	}

	private async testAuthorization(token): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			token.authorize((err, _) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}
}
