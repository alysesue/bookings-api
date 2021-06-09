import { SelectListDynamicField, SelectListOption, Service, TextDynamicField } from '../../../models';
import { Container } from 'typescript-ioc';
import { DynamicFieldsRepository } from '../dynamicFields.repository';
import { DynamicFieldsService } from '../dynamicFields.service';
import { DynamicFieldsRepositoryMock } from '../__mocks__/dynamicFields.repository.mock';
import { DynamicFieldsMapper } from '../dynamicFields.mapper';
import { DynamicFieldsMapperMock } from '../__mocks__/dynamicFields.mapper.mock';
import { ServicesServiceMock } from '../../../components/services/__mocks__/services.service';
import { ServicesService } from '../../../components/services/services.service';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import { DynamicFieldsActionAuthVisitor } from '../dynamicFields.auth';
import { DynamicFieldType, PersistDynamicFieldModel } from '../dynamicFields.apicontract';

jest.mock('../dynamicFields.auth', () => {
	return { DynamicFieldsActionAuthVisitor: jest.fn() };
});

jest.mock('../dynamicFields.repository', () => {
	class DynamicFieldsRepository {}
	return { DynamicFieldsRepository };
});

jest.mock('../dynamicFields.mapper', () => {
	class DynamicFieldsMapper {}
	return { DynamicFieldsMapper };
});

jest.mock('../../../components/services/services.service', () => {
	class ServicesService {}
	return { ServicesService };
});

jest.mock('../../../infrastructure/auth/userContext', () => {
	class UserContext {}
	return { UserContext };
});

jest.mock('../../../infrastructure/idHasher', () => {
	class IdHasher {}
	return { IdHasher };
});

beforeAll(() => {
	Container.bind(DynamicFieldsRepository).to(DynamicFieldsRepositoryMock);
	Container.bind(DynamicFieldsMapper).to(DynamicFieldsMapperMock);
	Container.bind(ServicesService).to(ServicesServiceMock);
	Container.bind(UserContext).to(UserContextMock);
	Container.bind(IdHasher).to(IdHasherMock);
});

describe('dynamicFields/dynamicFields.service', () => {
	const visitorMock = {
		hasPermission: jest.fn(),
	} as Partial<DynamicFieldsActionAuthVisitor>;

	const service = new Service();
	service.id = 1;
	service.name = 'svc';

	beforeEach(() => {
		jest.resetAllMocks();

		UserContextMock.getAuthGroups.mockReturnValue(Promise.resolve([]));
		(visitorMock.hasPermission as jest.Mock).mockReturnValue(true);
		(DynamicFieldsActionAuthVisitor as jest.Mock).mockImplementation(() => visitorMock);

		IdHasherMock.encode.mockImplementation((id: number) => id.toString());
		IdHasherMock.decode.mockImplementation((id: string) => Number.parseInt(id, 10));
	});

	it('should save dynamic field', async () => {
		const request = new PersistDynamicFieldModel();
		request.name = 'field';
		request.type = DynamicFieldType.TextField;
		request.textField = { charLimit: 50 };

		const entity = TextDynamicField.create(1, 'notes', 50);

		ServicesServiceMock.getService.mockReturnValue(Promise.resolve(service));
		DynamicFieldsMapperMock.mapToEntity.mockReturnValue(entity);
		DynamicFieldsRepositoryMock.save.mockImplementation((obj) => Promise.resolve(obj));

		const instance = Container.get(DynamicFieldsService);
		const result = await instance.save(request);

		expect(visitorMock.hasPermission).toBeCalled();
		expect(DynamicFieldsMapperMock.mapToEntity).toBeCalledWith(request, null);
		expect(DynamicFieldsRepositoryMock.save).toBeCalled();
		expect(result).toBeDefined();
	});

	it('should NOT save dynamic field - without permission', async () => {
		const request = new PersistDynamicFieldModel();
		request.name = 'field';
		request.type = DynamicFieldType.TextField;
		request.textField = { charLimit: 50 };

		const entity = TextDynamicField.create(1, 'notes', 50);

		ServicesServiceMock.getService.mockReturnValue(Promise.resolve(service));
		DynamicFieldsMapperMock.mapToEntity.mockReturnValue(entity);
		DynamicFieldsRepositoryMock.save.mockImplementation((obj) => Promise.resolve(obj));

		(visitorMock.hasPermission as jest.Mock).mockReturnValue(false);

		const instance = Container.get(DynamicFieldsService);
		const asyncTest = async () => await instance.save(request);

		await expect(asyncTest).rejects.toMatchInlineSnapshot(
			'[SYS_INVALID_AUTHORIZATION (403): User cannot perform this action (Create) for dynamic fields.]',
		);

		expect(visitorMock.hasPermission).toBeCalled();
		expect(DynamicFieldsRepositoryMock.save).not.toBeCalled();
	});

	it('should update dynamic field', async () => {
		const request = new PersistDynamicFieldModel();
		request.idSigned = '11';
		request.name = 'field';
		request.type = DynamicFieldType.TextField;
		request.textField = { charLimit: 50 };

		const entity = TextDynamicField.create(1, 'notes', 50);
		entity.id = 11;

		ServicesServiceMock.getService.mockReturnValue(Promise.resolve(service));
		DynamicFieldsRepositoryMock.get.mockImplementation(() => Promise.resolve(entity));
		DynamicFieldsMapperMock.mapToEntity.mockImplementation((_request, entity) => entity);
		DynamicFieldsRepositoryMock.save.mockImplementation((obj) => Promise.resolve(obj));

		const instance = Container.get(DynamicFieldsService);
		const result = await instance.update(request);

		expect(IdHasherMock.decode).toBeCalled();
		expect(visitorMock.hasPermission).toBeCalled();
		expect(DynamicFieldsMapperMock.mapToEntity).toBeCalledWith(request, entity);
		expect(DynamicFieldsRepositoryMock.save).toBeCalled();
		expect(result).toBeDefined();
	});

	it('should NOT update dynamic field - without permission', async () => {
		const request = new PersistDynamicFieldModel();
		request.idSigned = '11';
		request.name = 'field';
		request.type = DynamicFieldType.TextField;
		request.textField = { charLimit: 50 };

		const entity = TextDynamicField.create(1, 'notes', 50);
		entity.id = 11;

		ServicesServiceMock.getService.mockReturnValue(Promise.resolve(service));
		DynamicFieldsRepositoryMock.get.mockImplementation(() => Promise.resolve(entity));
		DynamicFieldsMapperMock.mapToEntity.mockImplementation((_request, entity) => entity);
		DynamicFieldsRepositoryMock.save.mockImplementation((obj) => Promise.resolve(obj));

		(visitorMock.hasPermission as jest.Mock).mockReturnValue(false);

		const instance = Container.get(DynamicFieldsService);

		const asyncTest = async () => await instance.update(request);
		await expect(asyncTest).rejects.toMatchInlineSnapshot(
			'[SYS_INVALID_AUTHORIZATION (403): User cannot perform this action (Update) for dynamic fields.]',
		);

		expect(visitorMock.hasPermission).toBeCalled();
		expect(DynamicFieldsRepositoryMock.save).not.toBeCalled();
	});

	it('should throw if dynamic field not found for Update', async () => {
		const request = new PersistDynamicFieldModel();
		request.idSigned = '11';
		request.name = 'field';
		request.type = DynamicFieldType.TextField;
		request.textField = { charLimit: 50 };

		const entity = TextDynamicField.create(1, 'notes', 50);
		entity.id = 11;

		ServicesServiceMock.getService.mockReturnValue(Promise.resolve(service));
		DynamicFieldsRepositoryMock.get.mockImplementation(() => Promise.resolve(null)); // null -> not found
		DynamicFieldsMapperMock.mapToEntity.mockImplementation((_request, entity) => entity);
		DynamicFieldsRepositoryMock.save.mockImplementation((obj) => Promise.resolve(obj));

		const instance = Container.get(DynamicFieldsService);
		const asyncTest = async () => await instance.update(request);

		await expect(asyncTest).rejects.toMatchInlineSnapshot('[SYS_NOT_FOUND (404): Dynamic field not found.]');
		expect(DynamicFieldsRepositoryMock.save).not.toBeCalled();
	});

	it('should return query result', async () => {
		const listOptions = {
			key: 1,
			value: 'English',
		} as SelectListOption;
		const dynamicFieldEntity = SelectListDynamicField.create(1, 'testDynamic', [listOptions]);
		dynamicFieldEntity.id = 1;

		const container = Container.get(DynamicFieldsService);
		DynamicFieldsRepositoryMock.getServiceFields.mockImplementation(() => Promise.resolve([dynamicFieldEntity]));
		const result = await container.getServiceFields(1);

		expect(result).toEqual([dynamicFieldEntity]);
	});

	it('should delete dynamic field', async () => {
		const request = new PersistDynamicFieldModel();
		request.idSigned = '11';
		request.name = 'field';
		request.type = DynamicFieldType.TextField;
		request.textField = { charLimit: 50 };

		const entity = TextDynamicField.create(1, 'notes', 50);
		entity.id = 11;

		ServicesServiceMock.getService.mockReturnValue(Promise.resolve(service));
		DynamicFieldsRepositoryMock.get.mockImplementation(() => Promise.resolve(entity));
		DynamicFieldsRepositoryMock.delete.mockImplementation(() => Promise.resolve());

		const instance = Container.get(DynamicFieldsService);
		await instance.delete('11');

		expect(IdHasherMock.decode).toBeCalled();
		expect(visitorMock.hasPermission).toBeCalled();
		expect(DynamicFieldsRepositoryMock.delete).toBeCalled();
	});

	it('should throw if dynamic field not found for Delete', async () => {
		const request = new PersistDynamicFieldModel();
		request.idSigned = '11';
		request.name = 'field';
		request.type = DynamicFieldType.TextField;
		request.textField = { charLimit: 50 };

		const entity = TextDynamicField.create(1, 'notes', 50);
		entity.id = 11;

		ServicesServiceMock.getService.mockReturnValue(Promise.resolve(service));
		DynamicFieldsRepositoryMock.get.mockImplementation(() => Promise.resolve(null)); // null -> not found
		DynamicFieldsRepositoryMock.delete.mockImplementation(() => Promise.resolve());

		const instance = Container.get(DynamicFieldsService);
		const asyncTest = async () => await instance.delete('11');

		await expect(asyncTest).rejects.toMatchInlineSnapshot('[SYS_NOT_FOUND (404): Dynamic field not found.]');
		expect(DynamicFieldsRepositoryMock.delete).not.toBeCalled();
	});

	it('should NOT delete dynamic field - without permission', async () => {
		const request = new PersistDynamicFieldModel();
		request.idSigned = '11';
		request.name = 'field';
		request.type = DynamicFieldType.TextField;
		request.textField = { charLimit: 50 };

		const entity = TextDynamicField.create(1, 'notes', 50);
		entity.id = 11;

		ServicesServiceMock.getService.mockReturnValue(Promise.resolve(service));
		DynamicFieldsRepositoryMock.get.mockImplementation(() => Promise.resolve(entity));
		DynamicFieldsRepositoryMock.delete.mockImplementation(() => Promise.resolve());

		(visitorMock.hasPermission as jest.Mock).mockReturnValue(false);

		const instance = Container.get(DynamicFieldsService);
		const asyncTest = async () => await instance.delete('11');

		await expect(asyncTest).rejects.toMatchInlineSnapshot(
			'[SYS_INVALID_AUTHORIZATION (403): User cannot perform this action (Delete) for dynamic fields.]',
		);

		expect(visitorMock.hasPermission).toBeCalled();
		expect(DynamicFieldsRepositoryMock.delete).not.toBeCalled();
	});
});
