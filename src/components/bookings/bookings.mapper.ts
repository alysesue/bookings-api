import { Booking, DynamicField, SelectListDynamicField, ServiceProvider, User } from '../../models/entities';
import {
	BookingDetailsRequest,
	BookingProviderResponse,
	BookingRequest,
	BookingResponse,
} from './bookings.apicontract';
import { UinFinConfiguration } from '../../models/uinFinConfiguration';
import { UserContextSnapshot } from '../../infrastructure/auth/userContext';
import { groupByKeyLastValue } from '../../tools/collections';
import { Inject, InRequestScope } from 'typescript-ioc';
import { DynamicFieldsService } from '../dynamicFields/dynamicFields.service';
import { DynamicValueJsonModel, DynamicValueType } from '../../models/entities/booking';
import { IdHasher } from '../../infrastructure/idHasher';
import {
	DynamicValueContract,
	DynamicValueTypeContract,
	PersistDynamicValueContract,
} from '../dynamicFields/dynamicValues.apicontract';

// tslint:disable-next-line: tsr-detect-unsafe-regexp
const MASK_UINFIN_REGEX = /(?<=^.{1}).{4}/;
const MASK_REPLACE_VALUE = '*'.repeat(4);

@InRequestScope
export class BookingsMapper {
	@Inject
	private dynamicFieldsService: DynamicFieldsService;
	@Inject
	private idHasher: IdHasher;

	public mapFieldValueToJson(field: DynamicField, fieldValue: PersistDynamicValueContract): DynamicValueJsonModel {
		if (!fieldValue) {
			return undefined;
		}

		// implement valueJson creation via a visitor for each field type later
		const selectListField = field as SelectListDynamicField;

		// valid field value type for this field
		if (fieldValue.type !== DynamicValueTypeContract.SingleSelection) {
			return undefined;
		}

		const selectedOption = selectListField.options.find((o) => o.key === fieldValue.SingleSelectionKey);
		const valueJson: DynamicValueJsonModel = {
			fieldId: field.id,
			fieldName: field.name,
			type: DynamicValueType.SingleSelection,
			SingleSelectionKey: selectedOption?.key,
			SingleSelectionValue: selectedOption?.value,
		};

		return valueJson;
	}

	public async mapDynamicValuesRequest(bookingRequest: BookingDetailsRequest, booking: Booking) {
		if (!bookingRequest.dynamicValuesUpdated || !bookingRequest.dynamicValues) {
			return;
		}

		const dynamicValuesLookup = groupByKeyLastValue(bookingRequest.dynamicValues, (e) =>
			this.idHasher.decode(e.fieldIdSigned),
		);
		const fieldDefinitions = await this.dynamicFieldsService.getServiceFields(booking.serviceId);
		const dynamicValuesJson = [];
		for (const field of fieldDefinitions) {
			const fieldValue = dynamicValuesLookup.get(field.id);
			const jsonValue = this.mapFieldValueToJson(field, fieldValue);
			if (jsonValue) {
				dynamicValuesJson.push(jsonValue);
			}
		}

		booking.dynamicValues = dynamicValuesJson;
	}

	public static maskUinFin(booking: Booking, userContext: UserContextSnapshot): string {
		if (!booking.service?.organisation) {
			throw new Error('Booking -> service -> organisation not loaded. BookingsMapper requires it.');
		}

		if (!booking.citizenUinFin) {
			return booking.citizenUinFin;
		}

		const uinFinConfig = new UinFinConfiguration(booking.service.organisation);
		if (uinFinConfig.canViewPlainUinFin(userContext)) {
			return booking.citizenUinFin;
		}

		return booking.citizenUinFin.replace(MASK_UINFIN_REGEX, MASK_REPLACE_VALUE);
	}

	public mapDataModels(bookings: Booking[], userContext: UserContextSnapshot): BookingResponse[] {
		return bookings?.map((booking) => {
			return this.mapDataModel(booking, userContext);
		});
	}

	// TODO: no need to pass in userContext, Inject it instead
	public mapDataModel(booking: Booking, userContext: UserContextSnapshot): BookingResponse {
		return {
			id: booking.id,
			status: booking.status,
			createdDateTime: booking.createdLog?.timestamp,
			startDateTime: booking.startDateTime,
			endDateTime: booking.endDateTime,
			serviceId: booking.serviceId,
			serviceName: booking.service?.name,
			serviceProviderId: booking.serviceProviderId,
			serviceProviderAgencyUserId: booking.serviceProvider?.agencyUserId,
			serviceProviderName: booking.serviceProvider?.name,
			serviceProviderEmail: booking.serviceProvider?.email,
			serviceProviderPhone: booking.serviceProvider?.phone,
			citizenUinFin: BookingsMapper.maskUinFin(booking, userContext),
			citizenName: booking.citizenName,
			citizenEmail: booking.citizenEmail,
			citizenPhone: booking.citizenPhone,
			location: booking.location,
			description: booking.description,
			videoConferenceUrl: booking.videoConferenceUrl,
			refId: booking.refId,
			dynamicValues: this.mapDynamicValuesModel(booking.dynamicValues),
		} as BookingResponse;
	}

	public mapDynamicValuesModel(dynamicValues: DynamicValueJsonModel[]): DynamicValueContract[] {
		return dynamicValues.map((obj) => {
			const contract = new DynamicValueContract();
			contract.fieldIdSigned = this.idHasher.encode(obj.fieldId);
			contract.fieldName = obj.fieldName;
			// use visitor to map values later
			contract.type = DynamicValueTypeContract.SingleSelection;
			contract.SingleSelectionKey = obj.SingleSelectionKey;
			contract.SingleSelectionValue = obj.SingleSelectionValue;

			return contract;
		});
	}

	public static mapProvider(provider: ServiceProvider): BookingProviderResponse {
		return {
			id: provider.id,
			name: provider.name,
		} as BookingProviderResponse;
	}

	public static getCitizenUinFin(currentUser: User, bookingRequest: BookingDetailsRequest): string {
		if (currentUser && currentUser.isCitizen()) {
			return currentUser.singPassUser.UinFin;
		}
		return bookingRequest.citizenUinFin;
	}

	public static mapBookingDetails(request: BookingDetailsRequest, booking: Booking, user: User) {
		booking.refId = request.refId;
		booking.citizenUinFin = this.getCitizenUinFin(user, request);
		booking.citizenName = request.citizenName;
		booking.citizenEmail = request.citizenEmail;
		booking.citizenPhone = request.citizenPhone;
		booking.location = request.location;
		booking.description = request.description;
		booking.videoConferenceUrl = request.videoConferenceUrl;
	}

	public static mapRequest(request: BookingRequest, booking: Booking, user: User) {
		this.mapBookingDetails(request, booking, user);
		booking.startDateTime = request.startDateTime;
		booking.endDateTime = request.endDateTime;
		booking.serviceProviderId = request.serviceProviderId;
		booking.captchaToken = request.captchaToken;
		booking.captchaOrigin = request.captchaOrigin;
	}
}
