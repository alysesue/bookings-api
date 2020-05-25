import { RequestEndpoint } from "mol-lib-common/network/request/RequestEndpoint";

// STUB
describe("Sample service", () => {

	const baseUrl = process.env["FUNCTIONAL_TEST_BASE_URL"] || "http://localhost:3999";

	it("should test api response", async () => {
		const response = await new RequestEndpoint()
			.setBaseUrl(baseUrl)
			.setJson(true)
			.get("health");

		expect(response.statusCode).toEqual(200);
	});

});
