import { Inject, Singleton } from 'typescript-ioc';

import { Booking } from '../../models/booking';

import { BookingsRepository } from './bookings.repository';

@Singleton
export class BookingsService {

	@Inject
	private usersRepository: BookingsRepository;

	public async getBookings(): Promise<Booking[]> {
		return this.usersRepository.getBookings();
	}
}
