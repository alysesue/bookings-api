import { Inject, InRequestScope } from 'typescript-ioc';
import {
	DynamicValueJsonModel,
	DynamicValueType,
	InformationOriginType,
	MyInfoOrigin,
} from '../../models/entities/jsonModels';
import { UserContext } from '../../infrastructure/auth/userContext';
import { MyInfoResponse } from '../../models/myInfoTypes';
import { MyInfoDynamicField } from '../../models';
import { MyInfoFieldType } from '../../models/entities/myInfoFieldType';

type MyInfoOriginRaw = {
	source?: string;
	classification?: string;
	lastupdated?: string;
	unavailable?: boolean;
};

@InRequestScope
export class MyInfoResponseMapper {
	@Inject
	private userContext: UserContext;

	public async mapOriginalValue(myInfoField: MyInfoDynamicField): Promise<DynamicValueJsonModel | undefined> {
		const myInfoResponse = await this.userContext.getMyInfo();
		let value: Partial<DynamicValueJsonModel>;

		switch (myInfoField.myInfoFieldType) {
			case MyInfoFieldType.regadd_postal:
				value = this.mapRegadd_postalField(myInfoResponse);
				break;
			case MyInfoFieldType.residentialstatus:
				value = this.mapResidentialStatus(myInfoResponse);
				break;
			case MyInfoFieldType.sex:
				value = this.mapSex(myInfoResponse);
				break;
			case MyInfoFieldType.nationality:
				value = this.mapNationality(myInfoResponse);
				break;
			case MyInfoFieldType.dob:
				value = this.mapDob(myInfoResponse);
				break;
			default:
				throw new Error(`MyInfoResponseMapper not implemented for value: ${myInfoField.myInfoFieldType}`);
		}

		if (!value) {
			return undefined;
		}

		value.fieldId = myInfoField.id;
		value.fieldName = myInfoField.name;
		value.myInfoFieldType = myInfoField.myInfoFieldType;

		return value as DynamicValueJsonModel;
	}

	private mapOrigin(
		origin: MyInfoOriginRaw,
	): {
		originType: InformationOriginType;
		myInfoOrigin: MyInfoOrigin;
	} {
		return {
			originType: InformationOriginType.MyInfo,
			myInfoOrigin: {
				source: origin?.source,
				classification: origin?.classification,
				lastupdated: origin?.lastupdated,
			},
		};
	}

	private mapSingleValue({
		code,
		desc,
		origin,
	}: {
		code: string | undefined;
		desc: string | undefined;
		origin: MyInfoOriginRaw;
	}): Partial<DynamicValueJsonModel> {
		if (!code) return undefined;
		return {
			type: DynamicValueType.SingleSelection,
			SingleSelectionKey: code,
			SingleSelectionValue: desc,
			origin: this.mapOrigin(origin),
		};
	}

	private mapTextField(rawValue: string | undefined, origin: MyInfoOriginRaw): Partial<DynamicValueJsonModel> {
		if (!rawValue) return undefined;
		return {
			type: DynamicValueType.Text,
			textValue: rawValue,
			origin: this.mapOrigin(origin),
		};
	}

	private mapDateOnlyField(rawValue: string | undefined, origin: MyInfoOriginRaw): Partial<DynamicValueJsonModel> {
		if (!rawValue) return undefined;
		return {
			type: DynamicValueType.DateOnly,
			dateOnlyValue: rawValue,
			origin: this.mapOrigin(origin),
		};
	}

	private mapRegadd_postalField(myInfoResponse: MyInfoResponse): Partial<DynamicValueJsonModel> | undefined {
		const rawValue = (myInfoResponse?.regadd as any)?.postal?.value as string | undefined;

		return this.mapTextField(rawValue, myInfoResponse?.regadd);
	}

	private mapResidentialStatus(myInfoResponse: MyInfoResponse): Partial<DynamicValueJsonModel> | undefined {
		return this.mapSingleValue({
			code: myInfoResponse?.residentialstatus?.code,
			desc: myInfoResponse?.residentialstatus?.desc,
			origin: myInfoResponse?.residentialstatus,
		});
	}

	private mapSex(myInfoResponse: MyInfoResponse): Partial<DynamicValueJsonModel> | undefined {
		return this.mapSingleValue({
			code: myInfoResponse?.sex?.code,
			desc: myInfoResponse?.sex?.desc,
			origin: myInfoResponse?.sex,
		});
	}

	private mapNationality(myInfoResponse: MyInfoResponse): Partial<DynamicValueJsonModel> | undefined {
		return this.mapSingleValue({
			code: myInfoResponse?.nationality?.code,
			desc: myInfoResponse?.nationality?.desc,
			origin: myInfoResponse?.nationality,
		});
	}

	private mapDob(myInfoResponse: MyInfoResponse): Partial<DynamicValueJsonModel> {
		return this.mapDateOnlyField(myInfoResponse?.dob?.value, myInfoResponse?.dob);
	}
}
