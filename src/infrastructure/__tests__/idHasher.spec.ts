import { getConfig } from '../../config/app-config';
import { Container } from 'typescript-ioc';
import { IdHasher } from '../idHasher';

jest.mock('../../config/app-config');
// idHasher is globally mocked, we need the real implementation here.
jest.mock('../idHasher', () => {
	return jest.requireActual('../idHasher');
});

describe('IdHasher tests', () => {
	beforeEach(() => {
		jest.resetAllMocks();

		(getConfig as jest.Mock).mockReturnValue({
			hashIdSalt: 'wobBINrJe916YEbgwov6F+5eZUVhTLav5/CQ6zf1p5lE1uPNI6SWZAhPeiJWv',
		});
	});

	it('should encode', () => {
		const hasher = Container.get(IdHasher);
		const result = hasher.encode(123);
		expect(result).toBe('OdVKn9JK');
	});

	it('should decode', () => {
		const hasher = Container.get(IdHasher);
		const result = hasher.decode('OdVKn9JK');
		expect(result).toBe(123);
	});

	it('should NOT encode undefined or null', () => {
		const hasher = Container.get(IdHasher);
		expect(hasher.encode(undefined)).toBe(undefined);
		expect(hasher.encode(null)).toBe(null);
	});

	it('should NOT decode undefined or null', () => {
		const hasher = Container.get(IdHasher);
		expect(hasher.decode(undefined)).toBe(undefined);
		expect(hasher.decode(null)).toBe(null);
	});
});
