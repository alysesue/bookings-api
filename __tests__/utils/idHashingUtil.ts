import { IdHasher } from "../../src/infrastructure/idHasher";
import { Inject } from "typescript-ioc";

export class IdHasherForFunctional {
	@Inject
	private idHasher: IdHasher;

	public async convertIdToHash(id: number): Promise<string> {
		return this.idHasher.encode(id);
	}

	public async convertHashToId(id: string): Promise<number> {
		return this.idHasher.decode(id);
	}
}
