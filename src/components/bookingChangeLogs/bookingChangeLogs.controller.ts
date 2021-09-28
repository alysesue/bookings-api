import { Inject } from 'typescript-ioc';
import { Controller, Get, Header, Query, Response, Route, Security, SuccessResponse, Tags } from 'tsoa';
import { MOLAuth } from 'mol-lib-common';
import { MOLUserAuthLevel } from 'mol-lib-api-contract/auth/auth-forwarder/common/MOLUserAuthLevel';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { BookingChangeLogResponseV1, BookingChangeLogResponseV2 } from './bookingChangeLogs.apicontract';
import { BookingChangeLogsService } from './bookingChangeLogs.service';
import { BookingChangeLogsMapper } from './bookingChangeLogs.mapper';
import { IdHasher } from '../../infrastructure/idHasher';

@Route('v1/bookinglogs')
@Tags('BookingLogs')
export class BookingChangeLogsController extends Controller {
	@Inject
	private changeLogsService: BookingChangeLogsService;
	@Inject
	private bookingChangeLogsMapper: BookingChangeLogsMapper;

	/**
	 * Retrieves all booking logs in the specified datetime range [changedSince, changedUntil).
	 *
	 * @param changedSince The lower bound datetime limit (inclusive) for logs' timestamp.
	 * @param changedUntil The upper bound datetime limit (exclusive) for logs' timestamp.
	 * @param @isInt bookingIds (Optional) filters by a list of booking ids.
	 * @param @isInt serviceId (Optional) filters by a service (id).
	 */
	@Get('')
	@SuccessResponse(200, 'Ok')
	@Security('optional-service')
	@MOLAuth({
		admin: {},
		agency: {},
		user: { minLevel: MOLUserAuthLevel.L2 },
	})
	@Response(401, 'Valid authentication types: [admin,agency,user]')
	public async getChangeLogs(
		@Query() changedSince: Date,
		@Query() changedUntil: Date,
		@Query() bookingIds?: number[],
		@Header('x-api-service') serviceId?: number,
	): Promise<ApiData<BookingChangeLogResponseV1[]>> {
		const logs = await this.changeLogsService.getLogs({ changedSince, changedUntil, serviceId, bookingIds });
		return ApiDataFactory.create(this.bookingChangeLogsMapper.mapDataModelsV1(logs));
	}
}

@Route('v2/bookinglogs')
@Tags('BookingLogs')
export class BookingChangeLogsControllerV2 extends Controller {
	@Inject
	private changeLogsService: BookingChangeLogsService;
	@Inject
	private bookingChangeLogsMapper: BookingChangeLogsMapper;
	@Inject
	private idHasher: IdHasher;

	/**
	 * Retrieves all booking logs in the specified datetime range [changedSince, changedUntil).
	 *
	 * @param changedSince The lower bound datetime limit (inclusive) for logs' timestamp.
	 * @param changedUntil The upper bound datetime limit (exclusive) for logs' timestamp.
	 * @param bookingIds (Optional) filters by a list of booking ids.
	 * @param serviceId (Optional) filters by a service (id).
	 */
	@Get('')
	@SuccessResponse(200, 'Ok')
	@Security('optional-service')
	@MOLAuth({
		admin: {},
		agency: {},
		user: { minLevel: MOLUserAuthLevel.L2 },
	})
	@Response(401, 'Valid authentication types: [admin,agency,user]')
	public async getChangeLogs(
		@Query() changedSince: Date,
		@Query() changedUntil: Date,
		@Query() bookingIds?: string[],
		@Header('x-api-service') serviceId?: string,
	): Promise<ApiData<BookingChangeLogResponseV2[]>> {
		const unsignedServiceId = this.idHasher.decode(serviceId);
		const unsignedBookingIds = bookingIds ? bookingIds.map((id) => this.idHasher.decode(id)) : undefined;
		const logs = await this.changeLogsService.getLogs({
			changedSince,
			changedUntil,
			serviceId: unsignedServiceId,
			bookingIds: unsignedBookingIds,
		});
		return ApiDataFactory.create(this.bookingChangeLogsMapper.mapDataModelsV2(logs));
	}
}
