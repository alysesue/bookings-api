import { InRequestScope } from 'typescript-ioc';
import { Booking, BookingUUIDInfo } from '../../models';
import { RepositoryBase } from '../../core/repository';

@InRequestScope
export class BookingsNoAuthRepository extends RepositoryBase<Booking> {
	constructor() {
		super(Booking);
	}

	public async getBookingInfoByUUID(bookingUUID: string): Promise<BookingUUIDInfo> {
		const repository = await this.getRepository();
		let query = repository
			.createQueryBuilder('booking')
			.where('booking."_uuid" = :bookingUUID', { bookingUUID })
			.leftJoin('booking._service', 'service')
			.leftJoin('booking._serviceProvider', 'sp');

		query = query
			.select('booking."_uuid"', 'bookingUUID')
			.addSelect('booking._id', 'bookingId')
			.addSelect('service._id', 'serviceId')
			.addSelect('service."_organisationId"', 'organisationId')
			.addSelect('sp._id', 'serviceProviderId');

		return await query.getRawOne<BookingUUIDInfo>();
	}
}
