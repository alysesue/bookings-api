import { LabelResponseModel } from '../labels/label.apicontract';

export class OneOffTimeslotRequestBase {
	public startDateTime: Date;
	public endDateTime: Date;
	/**
	 * @isInt
	 */
	public capacity: number;
	public title?: string;
	public description?: string;
	public labelIds?: string[];
}

export class OneOffTimeslotRequestV1 extends OneOffTimeslotRequestBase {
	/**
	 * @isInt
	 */
	public serviceProviderId: number;
}

export class OneOffTimeslotRequestV2 extends OneOffTimeslotRequestBase {
	public serviceProviderId: string;
}

export class OneOffTimeslotResponse {
	public idSigned: string;
	public startDateTime: Date;
	public endDateTime: Date;
	/**
	 * @isInt
	 */
	public capacity: number;
	public title?: string;
	public description?: string;
	public labels?: LabelResponseModel[];
}
