import { LabelRequestModel, LabelResponseModel } from "../labels/label.apicontract";

export class OneOffTimeslotRequest {
	public startDateTime: Date;
	public endDateTime: Date;
	/**
	 * @isInt
	 */
	public capacity: number;
	/**
	 * @isInt
	 */
	public serviceProviderId: number;
	public labels?: LabelRequestModel[];
}

export class OneOffTimeslotResponse {
	public idSigned: string;
	public startDateTime: Date;
	public endDateTime: Date;
	/**
	 * @isInt
	 */
	public capacity: number;
	public labels?: LabelResponseModel[];
}
