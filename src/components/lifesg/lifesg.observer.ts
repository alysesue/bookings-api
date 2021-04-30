import { BookingStatus } from '../../models';
import { Inject, InRequestScope } from 'typescript-ioc';
import { IObserver, ISubject } from '../../infrastructure/observer';
import { BookingsSubject } from '../bookings/bookings.subject';
import { LifeSGMapper } from './lifesg.mapper';
import { LifeSGMQSerice } from './lifesg.service';
@InRequestScope
export class LifeSGObserver implements IObserver {
	@Inject
	private lifeSGMQSerice: LifeSGMQSerice;
	public async update(subject: ISubject<any>): Promise<void> {
		if (
			subject instanceof BookingsSubject &&
			// tslint:disable-next-line: no-in-misuse
			[BookingStatus.Accepted, BookingStatus.Cancelled, BookingStatus.Rejected].includes(subject.booking.status)
		) {
			this.lifeSGMQSerice.send(
				LifeSGMapper.mapLifeSGAppointment(subject.booking, subject.action),
				subject.action,
			);
		}
	}
}
