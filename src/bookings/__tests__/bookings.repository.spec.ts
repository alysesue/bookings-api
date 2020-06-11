import { BookingsRepository } from "../bookings.repository";
import { DbConnection } from "../../core/db.connection";
import { Booking, BookingStatus } from "../../models";
import { Container } from "typescript-ioc";
import { InsertResult } from "typeorm";
import { DateHelper } from '../../infrastructure/dateHelper';
import { BookingSearchRequest } from '../bookings.apicontract';

describe("Bookings repository", () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it("should get bookings", async () => {
		Container.bind(DbConnection).to(MockDBConnection);
		MockDBConnection.find.mockImplementation(() => Promise.resolve([]));
		const bookingsRepository = Container.get(BookingsRepository);
		const result = await bookingsRepository.getBookings();
		expect(result).toStrictEqual([]);
	});

	it("should search bookings", async () => {
		Container.bind(DbConnection).to(MockDBConnection);
		let param: string;
		MockDBConnection.find.mockImplementation((_param) => {
			param = JSON.stringify(_param);
			return Promise.resolve([]);
		});

		const bookingsRepository = Container.get(BookingsRepository);
		const date = new Date(Date.UTC(2020, 0, 1, 14, 0));
		const filter = new BookingSearchRequest(
			date,
			DateHelper.addDays(date, 1),
			BookingStatus.Accepted
		);

		const result = await bookingsRepository.search(filter);
		expect(result).toStrictEqual([]);
		expect(MockDBConnection.find).toBeCalled();

		expect(param).toMatchSnapshot();
	});

	it("should search bookings without status", async () => {
		Container.bind(DbConnection).to(MockDBConnection);
		let param: string;
		MockDBConnection.find.mockImplementation((_param) => {
			param = JSON.stringify(_param);
			return Promise.resolve([]);
		});

		const bookingsRepository = Container.get(BookingsRepository);
		const date = new Date(Date.UTC(2020, 0, 1, 14, 0));
		const filter = new BookingSearchRequest(
			date,
			DateHelper.addDays(date, 1)
		);

		const result = await bookingsRepository.search(filter);
		expect(result).toStrictEqual([]);
		expect(MockDBConnection.find).toBeCalled();

		expect(param).toMatchSnapshot();
	});


	it("should save booking", async () => {
		jest.resetAllMocks();
		Container.bind(DbConnection).to(MockDBConnection);
		const insertResult = new InsertResult();
		insertResult.identifiers = [{ id: "abc" }];
		MockDBConnection.insert.mockImplementation(() => insertResult);
		const bookingsRepository = Container.get(BookingsRepository);
		const booking: Booking = new Booking(1, new Date(), 60);

		const result = await bookingsRepository.save(booking);
		expect(result.identifiers).toStrictEqual([{ id: "abc" }]);
	});

	it('should update booking', async () => {
		jest.resetAllMocks();
		Container.bind(DbConnection).to(MockDBConnection);

		const bookingsRepository = Container.get(BookingsRepository);
		const booking: Booking = new Booking(1, new Date(), 60);
		MockDBConnection.save.mockImplementation(() => booking);

		await bookingsRepository.update(booking);
		expect(MockDBConnection.save).toBeCalled();
	});

	it('should get booking', async () => {
		Container.bind(DbConnection).to(MockDBConnection);
		const booking = new Booking(1, new Date(), 60);
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
	public static save = jest.fn();

	public async getConnection(): Promise<any> {
		const connection = {
			getRepository: () => ({
				find: MockDBConnection.find,
				findOne: MockDBConnection.findOne,
				insert: MockDBConnection.insert,
				update: MockDBConnection.update,
				save: MockDBConnection.save
			})
		};
		return Promise.resolve(connection);
	}
}
