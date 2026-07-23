import { ZodError } from "zod";

export interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
}

export interface ApiResponse {
  setHeader(name: string, value: string | string[]): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
  end(): void;
}

type ApiHandler = (req: ApiRequest, res: ApiResponse) => Promise<void>;

export function withApi(handler: ApiHandler, allowedMethods: string[] = ["GET", "POST"]) {
  return async (req: ApiRequest, res: ApiResponse) => {
    setCorsHeaders(res);

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    if (!req.method || !allowedMethods.includes(req.method)) {
      res.status(405).json({ error: "method_not_allowed" });
      return;
    }

    try {
      await handler(req, res);
    } catch (error) {
      handleApiError(error, res);
    }
  };
}

export function parseBody(req: ApiRequest) {
  if (typeof req.body === "string") {
    return JSON.parse(req.body);
  }

  return req.body ?? {};
}

export function getBearerToken(req: ApiRequest) {
  const header = req.headers.authorization;
  const value = Array.isArray(header) ? header[0] : header;

  if (!value?.startsWith("Bearer ")) {
    throw new ApiError(401, "missing_authorization", "Provide a Supabase user JWT in the Authorization header.");
  }

  return value.slice("Bearer ".length);
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function setCorsHeaders(res: ApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "authorization,content-type");
}

function handleApiError(error: unknown, res: ApiResponse) {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({ error: error.code, message: error.message });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({ error: "invalid_request", issues: error.issues });
    return;
  }

  const message = error instanceof Error ? error.message : "Unexpected server error.";
  res.status(500).json({ error: "internal_error", message });
}
