import { Inject, InRequestScope } from 'typescript-ioc';
import { Booking, BookingChangeLog, BookingJsonSchemaV1, ChangeLogAction } from '../../models';
import { BookingChangeLogsRepository, ChangeLogSearchQuery } from './bookingChangeLogs.repository';
import { TransactionManager } from '../../core/transactionManager';
import { BookingIsolationLevel } from '../../models/entities/booking';
import { ConcurrencyError } from '../../errors/ConcurrencyError';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { UserContext } from '../../infrastructure/auth/userContext';

export type GetBookingFunction = (bookingId: number) => Promise<Booking>;
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
			startDateTime: booking.startDateTime,
			endDateTime: booking.endDateTime,
			serviceId: booking.serviceId,
			serviceName: booking.service.name,
			citizenUinFin: booking.citizenUinFin,
			citizenName: booking.citizenName,
			citizenEmail: booking.citizenEmail,
			citizenPhone: booking.citizenPhone,
			location: booking.location,
			description: booking.description,
		} as BookingJsonSchemaV1;

		if (booking.serviceProviderId) {
			const serviceProvider = booking.serviceProvider;
			if (!serviceProvider) {
				throw new Error('Booking.serviceProvider not loaded in memory');
			}
			jsonObj.serviceProviderId = booking.serviceProviderId;
			jsonObj.serviceProviderName = serviceProvider.name;
			jsonObj.serviceProviderEmail = serviceProvider.email;
			jsonObj.serviceProviderPhone = serviceProvider.phone;
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
			const booking = await getBookingFunction(bookingId);
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
			return newBooking;
		});
	}

	public async getLogs(options: ChangeLogSearchQuery): Promise<Map<number, BookingChangeLog[]>> {
		return await this.changeLogsRepository.getLogs(options);
	}
}
