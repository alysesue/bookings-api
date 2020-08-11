import { BookingsRepository } from "../bookings.repository";
import { DbConnection } from "../../core/db.connection";
import { Booking, BookingStatus } from "../../models";
import { Container } from "typescript-ioc";
import { InsertResult } from "typeorm";

const bookingMock = new Booking();
bookingMock.status = BookingStatus.Accepted;

describe("Bookings repository", () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it("should search bookings", async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([bookingMock])),
		};

		Container.bind(DbConnection).to(MockDBConnection);

		MockDBConnection.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const bookingsRepository = Container.get(BookingsRepository);

		const result = await bookingsRepository.search({
			serviceId: 1,
			serviceProviderId: 1,
			statuses: [BookingStatus.Accepted],
			from: new Date(Date.UTC(2020, 0, 1, 14, 0)),
			to: new Date(Date.UTC(2020, 0, 1, 15, 0)),
		});

		expect(result).toStrictEqual([bookingMock]);
		expect(queryBuilderMock.where).toBeCalledTimes(1);
		expect(queryBuilderMock.leftJoinAndSelect).toBeCalledTimes(2);
		expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
		expect(queryBuilderMock.getMany).toBeCalledTimes(1);
	});

	it("should search bookings without status", async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([bookingMock])),
		};

		Container.bind(DbConnection).to(MockDBConnection);

		MockDBConnection.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const bookingsRepository = Container.get(BookingsRepository);

		const result = await bookingsRepository.search({
			serviceId: 1,
			serviceProviderId: 1,
			from: new Date(Date.UTC(2020, 0, 1, 14, 0)),
			to: new Date(Date.UTC(2020, 0, 1, 15, 0)),
		});

		expect(result).toStrictEqual([bookingMock]);
		expect(queryBuilderMock.where).toBeCalledTimes(1);
		expect(queryBuilderMock.leftJoinAndSelect).toBeCalledTimes(2);
		expect(queryBuilderMock.orderBy).toBeCalledTimes(1);
		expect(queryBuilderMock.getMany).toBeCalledTimes(1);
	});

	it("should save booking", async () => {
		jest.resetAllMocks();
		Container.bind(DbConnection).to(MockDBConnection);
		const insertResult = new InsertResult();
		insertResult.identifiers = [{ id: "abc" }];
		MockDBConnection.insert.mockImplementation(() => insertResult);
		const bookingsRepository = Container.get(BookingsRepository);
		const booking: Booking = Booking.create(1, new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00'));

		const result = await bookingsRepository.save(booking);
		expect(result.identifiers).toStrictEqual([{ id: "abc" }]);
	});

	it('should update booking', async () => {
		jest.resetAllMocks();
		Container.bind(DbConnection).to(MockDBConnection);

		const bookingsRepository = Container.get(BookingsRepository);
		const booking: Booking = Booking.create(1, new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00'));
		MockDBConnection.save.mockImplementation(() => booking);

		await bookingsRepository.update(booking);
		expect(MockDBConnection.save).toBeCalled();
	});

	it('should get booking', async () => {
		Container.bind(DbConnection).to(MockDBConnection);
		const booking = Booking.create(1, new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00'));
		MockDBConnection.findOne.mockImplementation(() => Promise.resolve(booking));
		const bookingsRepository = Container.get(BookingsRepository);
		const result = await bookingsRepository.getBooking(1);
		expect(result).toStrictEqual(booking);
	});
});

class MockDBConnection extends DbConnection {
	public static insert = jest.fn();
	public static find = jest.fn();
	public static update = jest.fn();
	public static findOne = jest.fn();
	public static save = jest.fn();
	public static createQueryBuilder = jest.fn();

	public async getConnection(): Promise<any> {
		const connection = {
			getRepository: () => ({
				find: MockDBConnection.find,
				findOne: MockDBConnection.findOne,
				insert: MockDBConnection.insert,
				update: MockDBConnection.update,
				save: MockDBConnection.save,
				createQueryBuilder: MockDBConnection.createQueryBuilder,
			}),
		};
		return Promise.resolve(connection);
	}
}
