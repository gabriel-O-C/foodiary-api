import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { Controller } from "src/application/contracts/Controller";
import { lambdaBodyParser } from "../utils/lambdaBodyParser";
import { ZodError } from "zod";

export function lambdaHttpAdater(controller: Controller<unknown>) {
  return async (
    event: APIGatewayProxyEventV2,
  ): Promise<APIGatewayProxyResultV2> => {
    const body = lambdaBodyParser(event.body);
    const params = event.pathParameters ?? {};
    const queryParams = event.queryStringParameters ?? {};

    try {
      const response = await controller.execute({
        body,
        params,
        queryParams,
      });

      return {
        statusCode: response.statusCode,
        body: response.body ? JSON.stringify(response.body) : undefined,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: {
              code: "VALIDATION",
              message: error.issues.map((issue) => ({
                field: issue.path.join("."),
                error: issue.message,
              })),
            },
          }),
        };
      }

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Internal server error",
          },
        }),
      };
    }
  };
}
