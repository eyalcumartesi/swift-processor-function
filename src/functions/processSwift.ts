import {
	HttpRequest,
	HttpResponseInit,
	InvocationContext,
} from "@azure/functions";
import { parseSWIFTFile } from "../parsers/parseSwift";

export async function httpFunction(
	req: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	try {
		const fileContent = req.body?.fileContent;

		if (!fileContent) {
			return {
				status: 400,
				body: JSON.stringify({ error: "File content is required" }),
			};
		}

		const parsedData = parseSWIFTFile(fileContent);

		return {
			status: 200,
			body: JSON.stringify(parsedData),
		};
	} catch (error) {
		context.error("Error processing SWIFT file:", error);
		return {
			status: 500,
			body: JSON.stringify({ error: "Internal server error" }),
		};
	}
}

export default httpFunction;
