import { Inject, InRequestScope } from 'typescript-ioc';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { Booking, BookingChangeLog, BookingJsonSchemaV1, ChangeLogAction } from '../../models';
import { TransactionManager } from '../../core/transactionManager';
import { BookingIsolationLevel } from '../../models/entities/booking';
import { ConcurrencyError } from '../../errors/concurrencyError';
import { UserContext } from '../../infrastructure/auth/userContext';
import { BookingChangeLogsRepository, ChangeLogSearchQuery } from './bookingChangeLogs.repository';
import * as _ from 'lodash';

export type GetBookingFunction = (bookingId: number, options: { byPassAuth?: boolean }) => Promise<Booking>;
export type BookingActionFunction = (booking: Booking) => Promise<[ChangeLogAction, Booking]>;

@InRequestScope
export class BookingChangeLogsService {
	@Inject
	private transactionManager: TransactionManager;
	@Inject
	private changeLogsRepository: BookingChangeLogsRepository;
	@Inject
	private userContext: UserContext;

	private mapToJsonSchema(booking: Booking): BookingJsonSchemaV1 {
		if (!booking) return {} as BookingJsonSchemaV1;

		if (!booking.service) {
			throw new Error('Booking.service not loaded in memory');
		}

		const jsonObj = {
			id: booking.id,
			status: booking.status,
			startDateTime: new Date(booking.startDateTime),
			endDateTime: new Date(booking.endDateTime),
			serviceId: booking.serviceId,
			serviceName: booking.service.name,
			citizenUinFin: booking.citizenUinFin,
			citizenName: booking.citizenName,
			citizenEmail: booking.citizenEmail,
			citizenPhone: booking.citizenPhone,
			location: booking.location,
			description: booking.description,
			videoConferenceUrl: booking.videoConferenceUrl,
			refId: booking.refId,
			dynamicValues: _.cloneDeep(booking.dynamicValues),
			bookedSlots: _.cloneDeep(booking.bookedSlots),
		} as BookingJsonSchemaV1;

		if (booking.serviceProviderId) {
			const serviceProvider = booking.serviceProvider;
			if (!serviceProvider) {
				throw new Error('Booking.serviceProvider not loaded in memory');
			}
			jsonObj.serviceProviderId = booking.serviceProviderId;
			jsonObj.serviceProviderAgencyUserId = serviceProvider.agencyUserId;
			jsonObj.serviceProviderName = serviceProvider.name;
			jsonObj.serviceProviderEmail = serviceProvider.email;
			jsonObj.serviceProviderPhone = serviceProvider.phone;
			jsonObj.serviceProviderAliasName = serviceProvider.aliasName;
		}

		return jsonObj;
	}

	public async executeAndLogAction(
		bookingId: number,
		getBookingFunction: GetBookingFunction,
		actionFunction: BookingActionFunction,
	): Promise<Booking> {
		const maxAttempts = 3;
		let attempts = 0;
		while (attempts < maxAttempts) {
			try {
				return await this.executeInTransation(bookingId, getBookingFunction, actionFunction);
			} catch (e) {
				if (e.name === ConcurrencyError.name) {
					if (attempts >= maxAttempts) {
						throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(e.message);
					}
				} else {
					throw e;
				}
			}
			attempts++;
		}
	}

	private async executeInTransation(
		bookingId: number,
		getBookingFunction: GetBookingFunction,
		actionFunction: BookingActionFunction,
	): Promise<Booking> {
		const user = await this.userContext.getCurrentUser();
		return await this.transactionManager.runInTransaction(BookingIsolationLevel, async () => {
			const booking = await getBookingFunction(bookingId, {});
			const previousState = this.mapToJsonSchema(booking);
			const [action, newBooking] = await actionFunction(booking);
			const newState = this.mapToJsonSchema(newBooking);

			const changelog = BookingChangeLog.create({
				action,
				booking: newBooking,
				user,
				previousState,
				newState,
			});

			await this.changeLogsRepository.save(changelog);
			if (bookingId) {
				return newBooking;
			} else {
				const reloadBooking = await getBookingFunction(newBooking.id, { byPassAuth: true });
				return reloadBooking;
			}
		});
	}

	public async getLogs(options: ChangeLogSearchQuery): Promise<Map<number, BookingChangeLog[]>> {
		return await this.changeLogsRepository.getLogs(options);
	}
}
