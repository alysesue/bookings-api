import { Inject, InRequestScope } from "typescript-ioc";
import { Booking } from "../../models";
import { UserContext } from "../../infrastructure/userContext.middleware";
import { BookingChangeLog, BookingJsonSchemaV1, ChangeLogAction } from "../../models/entities/bookingChangeLog";
import { BookingChangeLogsRepository } from "./bookingChangeLogs.repository";
import { TransactionManager } from "../../core/transactionManager";
import { IsolationLevel } from "typeorm/driver/types/IsolationLevel";

export type BookingActionFunction = (booking: Booking) => Promise<[ChangeLogAction, Booking]>;

@InRequestScope
export class BookingChangeLogsService {
	private static readonly isolationLevel: IsolationLevel = "READ COMMITTED";

	@Inject
	private transactionManager: TransactionManager;
	@Inject
	private changeLogsRepository: BookingChangeLogsRepository;
	@Inject
	private userContext: UserContext;

	private mapBookingState(booking: Booking): BookingJsonSchemaV1 {
		if (!booking)
			return {} as BookingJsonSchemaV1;

		const jsonObj = {
			id: booking.id,
			status: booking.status,
			startDateTime: booking.startDateTime,
			endDateTime: booking.startDateTime,
			serviceId: booking.serviceId,
			serviceName: booking.service.name,
			CitizenUinFin: booking.citizenUinFin,
			// TODO: ADD Citizen data;
			// CitizenName: string,
			// CitizenEmail: string,
			// CitizenPhone: string,
			// Location: string,
			// Description: string,
		} as BookingJsonSchemaV1;

		if (booking.serviceProviderId) {
			const serviceProvider = booking.serviceProvider;
			jsonObj.serviceProviderId = booking.serviceProviderId;
			jsonObj.serviceProviderName = serviceProvider.name;
			jsonObj.serviceProviderEmail = serviceProvider.email;
			// TODO: ADD SP PHONE jsonObj.serviceProviderPhone = serviceProvider.phone;
		}

		return jsonObj;
	}

	public async executeAndLogAction(booking: Booking, actionFunction: BookingActionFunction): Promise<Booking> {
		const user = await this.userContext.getCurrentUser();

		return await this.transactionManager.runInTransaction(BookingChangeLogsService.isolationLevel, async () => {
			const previousState = this.mapBookingState(booking);
			const [action, newBooking] = await actionFunction(booking);
			const newState = this.mapBookingState(newBooking);

			const changelog = BookingChangeLog.create({
				action,
				booking: newBooking,
				user,
				previousState,
				newState
			});

			await this.changeLogsRepository.saveLog(changelog);
			return newBooking;
		});
	}
}
