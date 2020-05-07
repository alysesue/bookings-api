import {BookingsRepository} from "../bookings.repository";
import {DbConnection} from "../../core/db.connection";
import {Booking} from "../../models";
import {Container} from "typescript-ioc";
import {InsertResult, UpdateResult} from "typeorm";

describe("Bookings repository", () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it("should get bookings", async () => {
		Container.bind(DbConnection).to(MockDBConnection);
		MockDBConnection.find.mockImplementation(() => Promise.resolve([]));
		const bookingsRepository = new BookingsRepository();
		const result = await bookingsRepository.getBookings();
		expect(result).toStrictEqual([]);
	});

	it("should save booking", async () => {
		jest.resetAllMocks();
		Container.bind(DbConnection).to(MockDBConnection);
		const insertResult = new InsertResult();
		insertResult.identifiers = [{id: "abc"}];
		MockDBConnection.insert.mockImplementation(() => insertResult);
		const bookingsRepository = new BookingsRepository();
		const booking: Booking = new Booking(new Date(), 60);

		const result = await bookingsRepository.save(booking);
		expect(result.identifiers).toStrictEqual([{id: "abc"}]);
	});

	it('should update booking', async () => {
		jest.resetAllMocks();
		Container.bind(DbConnection).to(MockDBConnection);
		const updateRe = new UpdateResult();

		MockDBConnection.update.mockImplementation(() => updateRe);
		const bookingsRepository = new BookingsRepository();
		const booking: Booking = new Booking(new Date(), 60);

		await bookingsRepository.update(booking);
		expect(MockDBConnection.update.mock.calls[0][1]).toBe(booking);
	});

	it('should get booking', async () => {
		Container.bind(DbConnection).to(MockDBConnection);
		const booking = new Booking(new Date(), 60);
		MockDBConnection.findOne.mockImplementation(() => Promise.resolve(booking));
		const bookingsRepository = Container.get(BookingsRepository);
		const result = await bookingsRepository.getBooking('1');
		expect(result).toStrictEqual(booking);
	});
});

class MockDBConnection extends DbConnection {
	public static insert = jest.fn();
	public static find = jest.fn();
	public static update = jest.fn();
	public static findOne = jest.fn();

	public async getConnection(): Promise<any> {
		const connection = {
			getRepository: () => ({
				find: MockDBConnection.find,
				findOne: MockDBConnection.findOne,
				insert: MockDBConnection.insert,
				update: MockDBConnection.update,
			}),
		};
		return Promise.resolve(connection);
	}
}
