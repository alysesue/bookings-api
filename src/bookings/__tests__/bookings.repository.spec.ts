import { BookingsRepository } from '../bookings.repository';
import { DbConnection } from '../../core/db.connection';
import { Container } from 'typescript-ioc';

describe('Bookings repository', () => {
	it('should get bookings', () => {
		Container.bind(DbConnection).to(MockDBConnection);
		const bookingsRepository = new BookingsRepository();
		const result = bookingsRepository.getBookings();
		expect(result).not.toBe(undefined);
	});
});

class MockDBConnection extends DbConnection {

	constructor() {
		super();
	}


	public async getConnection(): Promise<any> {
		const repository = jest.fn();
		const connection = {
			getRepository: repository,
		};
		return Promise.resolve(connection);
	}
}
