import { getRequestHeaders } from "../requestHelper";
import { Controller } from "tsoa";

describe('request helper tests', () => {
	it('should get headers', () => {
		const headers = {};
		headers['MY_HEADER'] = 'value';

		const controllerMock = new MyController();
		(controllerMock as any).context = { request: { headers } };

		const accessor = getRequestHeaders(controllerMock);
		expect(accessor.get('MY_HEADER')).toBe('value');
	});
});

class MyController extends Controller { }
