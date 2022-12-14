import { calendar_v3 } from 'googleapis';
import { JWT } from 'google-auth-library';
import { Singleton } from 'typescript-ioc';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

/**
 * @deprecated The class should not be used, it has been created at the start of the project to link booking with google calendar (with caldav protocole). We dont use it anymore
 */
@Singleton
export class GoogleApi {
	private _authToken: any = null;

	private static async loadJWTTokenFromJson(): Promise<JWT> {
		const newToken = new JWT();
		const json = JSON.parse('{}');
		newToken.fromJSON(json);

		return newToken.createScoped(SCOPES);
	}

	public setToken(token) {
		this._authToken = token;
	}

	public async getCalendarApi(): Promise<calendar_v3.Calendar> {
		const token = await this.getAuthToken();
		return new calendar_v3.Calendar({ auth: token });
	}

	public async getAccessToken(): Promise<string> {
		const jwt = await this.getAuthToken();
		return (await jwt.getAccessToken()).token;
	}

	private async getAuthToken(): Promise<JWT> {
		if (this._authToken === null) {
			const newToken = await GoogleApi.loadJWTTokenFromJson();

			await newToken.authorize();
			this.setToken(newToken);
		}

		return this._authToken;
	}
}
