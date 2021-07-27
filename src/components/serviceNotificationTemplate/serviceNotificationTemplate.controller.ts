import { Inject } from 'typescript-ioc';
import { Body, Controller, Get, Path, Post, Put, Query, Response, Route, SuccessResponse, Tags } from 'tsoa';
import { MOLAuth } from 'mol-lib-common';
import { ApiData, ApiDataFactory } from '../../apicontract';

import {
	ServiceNotificationTemplateRequest,
	ServiceNotificationTemplateResponse,
} from '../serviceNotificationTemplate/serviceNotificationTemplate.apicontract';
import { ServiceNotificationTemplateService } from '../serviceNotificationTemplate/serviceNotificationTemplate.service';
import { EmailNotificationTemplateType } from '../notifications/notifications.enum';
import { ServiceNotificationTemplateMapper } from '../serviceNotificationTemplate/serviceNotificationTemplate.mapper';
import {IdHasher} from "../../infrastructure/idHasher";

@Route('v1/services')
@Tags('Service Notification Template')
export class ServicesNotificationTemplateController extends Controller {
	@Inject
	private serviceNotificationsTemplatesService: ServiceNotificationTemplateService;
	@Inject
	private notificationTemplateMapper: ServiceNotificationTemplateMapper;
	@Inject
	private idHasher: IdHasher;

	/**
	 * Get a single email notification template of a service.
	 * If service template does not exist, then get the default template.
	 *
	 * @param @isInt serviceId The service id.
	 * @param @isInt  emailTemplateType The enum type of email template.
	 */
	@Get('{serviceId}/notificationTemplate/email')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getEmailNotificationTemplate(
		@Path() serviceId: number,
		@Query() emailTemplateType: EmailNotificationTemplateType,
	): Promise<ApiData<ServiceNotificationTemplateResponse>> {
		const data = await this.serviceNotificationsTemplatesService.getEmailNotificationTemplateByType(
			serviceId,
			emailTemplateType,
		);
		return ApiDataFactory.create(this.notificationTemplateMapper.mapGetResponseToNotifTemplateResponse(data));
	}

	/**
	 * Creates a single email notification template of a service.
	 *
	 * @param @isInt serviceId The service id.
	 * @param request
	 */
	@Post('{serviceId}/notificationTemplate/email')
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async createEmailNotificationTemplate(
		@Path() serviceId: number,
		@Body() request: ServiceNotificationTemplateRequest,
	): Promise<ApiData<ServiceNotificationTemplateResponse>> {
		const data = await this.serviceNotificationsTemplatesService.addEmailServiceNotificationTemplateByType(
			serviceId,
			request,
		);
		return ApiDataFactory.create(this.notificationTemplateMapper.mapToNotificationTemplateResponse(data));
	}

	/**
	 * Update an existing email notification template of a service.
	 *
	 * @param @isInt serviceId The service id.
	 * @param request
	 */
	@Put('{serviceId}/notificationTemplate/email/{id}')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async updateEmailNotificationTemplate(
		@Path() serviceId: number,
		@Path() id: string,
		@Body() request: ServiceNotificationTemplateRequest,
	): Promise<ApiData<ServiceNotificationTemplateResponse>> {
		const idNumber = this.idHasher.decode(id);
		const data = await this.serviceNotificationsTemplatesService.updateEmailServiceNotificationTemplate(
			serviceId,
			idNumber,
			request,
		);
		return ApiDataFactory.create(this.notificationTemplateMapper.mapToNotificationTemplateResponse(data));
	}
}
