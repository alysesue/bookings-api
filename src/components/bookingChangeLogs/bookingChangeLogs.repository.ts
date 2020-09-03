import { Inject, InRequestScope } from "typescript-ioc";
import { BookingChangeLog } from "../../models";
import { RepositoryBase } from "../../core/repository";
import { UserContext } from "../../infrastructure/userContext.middleware";

@InRequestScope
export class BookingChangeLogsRepository extends RepositoryBase<BookingChangeLog> {
	@Inject
	private userContext: UserContext;

	constructor() {
		super(BookingChangeLog);
	}

	public async saveLog(changeLog: BookingChangeLog): Promise<BookingChangeLog> {
		const repository = await this.getRepository();
		return repository.save(changeLog);
	}
}
