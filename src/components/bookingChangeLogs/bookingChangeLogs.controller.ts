import { Inject } from 'typescript-ioc';
import { Controller, Get, Header, Query, Response, Route, Security, SuccessResponse, Tags } from 'tsoa';
import { MOLAuth } from 'mol-lib-common';
import { MOLUserAuthLevel } from 'mol-lib-api-contract/auth/auth-forwarder/common/MOLUserAuthLevel';
import { BookingChangeLogResponse } from './bookingChangeLogs.apicontract';
import { BookingChangeLogsService } from './bookingChangeLogs.service';
import { BookingChangeLogsMapper } from './bookingChangeLogs.mapper';

@Route('v1/bookinglogs')
@Tags('BookingLogs')
export class BookingChangeLogsController extends Controller {
	@Inject
	private changeLogsService: BookingChangeLogsService;

	/**
	 * Retrieves all booking logs in the specified datetime range [changedSince, changedUntil).
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
		user: { minLevel: MOLUserAuthLevel.L2 },
	})
	@Response(401, 'Valid authentication types: [admin,user]')
	public async getChangeLogs(
		@Query() changedSince: Date,
		@Query() changedUntil: Date,
		@Query() bookingIds?: number[],
		@Header('x-api-service') serviceId?: number,
	): Promise<BookingChangeLogResponse[]> {
		const logs = await this.changeLogsService.getLogs({ changedSince, changedUntil, serviceId, bookingIds });
		return BookingChangeLogsMapper.mapDataModels(logs);
	}
}
