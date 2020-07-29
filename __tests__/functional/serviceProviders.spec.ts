import { RequestEndpoint } from "mol-lib-common/network/request/RequestEndpoint";

describe("Tests endpoint and populate data", () => {
	const baseUrl = process.env["FUNCTIONAL_TEST_BASE_URL_LOCAL"] || process.env["FUNCTIONAL_TEST_BASE_URL"] || "http://localhost:3999/bookingsg/api/v1";

	it("Get service provider schedule", async () => {
		const serviceProviders = await new RequestEndpoint()
			.setBaseUrl(baseUrl)
			.setHeader("Content-Type", "application/json")
			.get("/service-providers");

		expect(serviceProviders.statusCode).toEqual(200);

		const id = JSON.parse(serviceProviders.body).data[0].id; // Get ID of first SP

		const getSPWithTimeslotSchedules = await new RequestEndpoint()
			.setBaseUrl(baseUrl)
			.setHeader("Content-Type", "application/json")
			.get(`/service-providers/${id}/timeslotSchedule`);
		expect(getSPWithTimeslotSchedules.statusCode).toEqual(204);
	});

});
