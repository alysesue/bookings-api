import { ServiceProviderLabelCategory } from '../../../models/entities';
import { SPLabelsCategoriesService } from '../serviceProvidersLabels.service';

export class SPLabelsCategoriesServiceMock implements Partial<SPLabelsCategoriesService> {
	public static sortSPLabelForDeleteCategory = jest.fn();
	public static updateSPLabelToNoCategory = jest.fn();
	public static updateSPLabel = jest.fn<Promise<ServiceProviderLabelCategory[]>, any>();

	public sortSPLabelForDeleteCategory(...param) {
		return SPLabelsCategoriesServiceMock.sortSPLabelForDeleteCategory(...param);
	}

	public async updateSPLabelToNoCategory(...param) {
		return await SPLabelsCategoriesServiceMock.updateSPLabelToNoCategory(...param);
	}

	public async updateSPLabel(...params): Promise<ServiceProviderLabelCategory[]> {
		return await SPLabelsCategoriesServiceMock.updateSPLabel(...params);
	}
}
