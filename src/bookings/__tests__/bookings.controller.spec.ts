import { Container } from 'typescript-ioc';

import { Booking } from '../../models/booking';

import { BookingsController } from '../bookings.controller';
import { BookingsResponse } from '../bookings.response';
import { BookingsService } from '../bookings.service';

describe('User.Controller', () => {
	it('should have http code 200', async () => {
		Container.bind(BookingsService).to(BookingsServiceMock);
		const controller = Container.get(BookingsController);
		const result = await controller.getBookings();

		expect(result).toBeTruthy();
	});

	it('should return the users from usersService', async () => {
		Container.bind(BookingsService).to(BookingsServiceMock);
		const controller = Container.get(BookingsController);
		const result = await controller.getBookings();

		expect(result).toStrictEqual(new BookingsResponse([new Booking('Jake')]));
	});
});

class BookingsServiceMock extends BookingsService {
	private readonly bookings: Booking[];

	constructor() {
		super();
		this.bookings = [new Booking('Jake')];
	}

	public async getBookings(): Promise<Booking[]> {
		return this.bookings;
	}
}
