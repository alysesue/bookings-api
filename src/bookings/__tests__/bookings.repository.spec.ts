import { BookingsRepository } from "../bookings.repository";
import { DbConnection } from "../../core/db.connection";
import { Booking } from "../../models";
import { Container, Snapshot } from "typescript-ioc";
import { InsertResult } from "typeorm";

describe("Bookings repository", () => {
	let snapshot: Snapshot;
	beforeAll(() => {
		// Store the IoC configuration
		snapshot = Container.snapshot();

		// Clears mock counters, not implementation
		jest.clearAllMocks();
	});

	afterAll(() => {
		// Put the IoC configuration back for IService, so other tests can run.
		snapshot.restore();
	});

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
});

class MockDBConnection extends DbConnection {
	public static insert = jest.fn();
	public static find = jest.fn();

	public async getConnection(): Promise<any> {
		const connection = {
			getRepository: () => ({
				find: MockDBConnection.find,
				insert: MockDBConnection.insert,
			}),
		};
		return Promise.resolve(connection);
	}
}
