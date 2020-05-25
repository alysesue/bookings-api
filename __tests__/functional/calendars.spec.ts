import { RequestEndpoint } from "mol-lib-common/network/request/RequestEndpoint";

describe("Test API", () => {
	const baseUrl = process.env["FUNCTIONAL_TEST_BASE_URL"] || "http://localhost:3999";

	it("should  creat calendar, templatesTimeslots and link them", async () => {
		const data = {
			params: {},
			body: {
				serviceProviderName: "ProviderName"
			}
		};
		const response1 = await new RequestEndpoint()
			.setBaseUrl(baseUrl)
			.setHeader("Content-Type", "application/json")
			.post("/api/v1/calendars", data);

		expect(response1.statusCode).toEqual(200);

		const uuid = JSON.parse(response1.body).data.uuid;

		// =====================================================================
		const dataTemplatesTimeslots = {
			params: {},
			body: {
				"name": "Template name",
				"firstSlotStartTimeInHHmm": "00:00",
				"lastSlotEndTimeInHHmm": "23:00",
				"slotsDurationInMin": 60,
				"weekdays": [
					0, 1, 2, 3, 4, 5, 6
				]
			}
		};
		const response2 = await new RequestEndpoint()
			.setBaseUrl(baseUrl)
			.setHeader("Content-Type", "application/json")
			.post("/api/v1/templatesTimeslots", dataTemplatesTimeslots);

		expect(response2.statusCode).toEqual(200);

		// =====================================================================
		const dataTemplatesTimeslot = {
			params: {},
			body: {
				"templatesTimeslotId": 1
			}
		};
		const response3 = await new RequestEndpoint()
			.setBaseUrl(baseUrl)
			.setHeader("Content-Type", "application/json")
			.put(`/api/v1/calendars/${uuid}/templatestimeslot`, dataTemplatesTimeslot);

		expect(response3.statusCode).toEqual(200);
	});

});
