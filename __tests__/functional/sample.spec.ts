import { RequestEndpoint } from "mol-lib-common/network/request/RequestEndpoint";

// STUB
describe("Sample service", () => {
	const baseUrl = process.env["FUNCTIONAL_TEST_BASE_URL"];

	it("should test something against the CI env", async () => {
		const response = await new RequestEndpoint()
			.setBaseUrl(baseUrl)
			.post("wud");

		expect(response.statusCode).toEqual(200);
	});
});
