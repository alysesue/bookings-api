/* istanbul ignore file */

import { Singleton } from "typescript-ioc";
import { calendar_v3 } from "googleapis";

const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const credentials = require('../config/googleapi-credentials.json');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

@Singleton
export class GoogleCalendarApiWrapper {
	private _authToken: any = null;

	private async getAuthToken(): Promise<any> {
		const { client_email, private_key } = credentials;

		if (this._authToken === null) {
			const newToken = new google.auth.JWT(
				client_email,
				null,
				private_key,
				SCOPES);

			await this.testAuthorization(newToken);
			this._authToken = newToken;
		}

		return this._authToken;
	}

	private async testAuthorization(token): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			token.authorize(function (err, _) {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}

	public async getCalendarApi(): Promise<calendar_v3.Calendar> {
		const token = await this.getAuthToken();
		return new calendar_v3.Calendar({ auth: token });
	}
}
