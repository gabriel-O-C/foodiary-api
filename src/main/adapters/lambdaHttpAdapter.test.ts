import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { Controller } from "src/application/contracts/Controller";
import { lambdaHttpAdater } from "./lambdaHttpAdapter";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock parser if needed
vi.mock("../../utils/lambdaBodyParser", () => ({
  lambdaBodyParser: (body: string | undefined) => {
    if (!body) return undefined;
    return JSON.parse(body);
  },
}));

const mockController = {
  handle: vi.fn(),
} as unknown as Controller<unknown>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("lambdaHttpAdapter", () => {
  it("should call controller with parsed body, path params, and query params", async () => {
    mockController.execute = vi.fn().mockResolvedValueOnce({
      statusCode: 200,
      body: { message: "ok" },
    });

    const event = {
      body: JSON.stringify({ name: "test" }),
      pathParameters: { id: "123" },
      queryStringParameters: { search: "query" },
    } as unknown as APIGatewayProxyEventV2;

    const handler = lambdaHttpAdater(mockController);
    const result = await handler(event);

    expect(mockController.execute).toHaveBeenCalledWith({
      body: { name: "test" },
      params: { id: "123" },
      queryParams: { search: "query" },
    });

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({ message: "ok" }),
    });
  });

  it("should handle missing optional fields gracefully", async () => {
    mockController.execute = vi.fn().mockResolvedValueOnce({
      statusCode: 204,
    });

    const event = {} as APIGatewayProxyEventV2;
    const handler = lambdaHttpAdater(mockController);
    const result = await handler(event);

    expect(mockController.execute).toHaveBeenCalledWith({
      body: undefined,
      params: {},
      queryParams: {},
    });

    expect(result).toEqual({
      statusCode: 204,
      body: undefined,
    });
  });

  it("should throw error for malformed JSON body", async () => {
    const malformedEvent = {
      body: "{ invalid json",
    } as APIGatewayProxyEventV2;

    const handler = lambdaHttpAdater(mockController);

    await expect(handler(malformedEvent)).rejects.toThrow();
  });
});
