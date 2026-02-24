import { APIGatewayProxyResult } from "aws-lambda";

export function success(body: unknown): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  };
}

export function created(body: unknown): APIGatewayProxyResult {
  return {
    statusCode: 201,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  };
}

export function badRequest(message: string): APIGatewayProxyResult {
  return {
    statusCode: 400,
    headers: corsHeaders(),
    body: JSON.stringify({ error: message }),
  };
}

export function unauthorized(message = "Unauthorized"): APIGatewayProxyResult {
  return {
    statusCode: 401,
    headers: corsHeaders(),
    body: JSON.stringify({ error: message }),
  };
}

export function notFound(message = "Not found"): APIGatewayProxyResult {
  return {
    statusCode: 404,
    headers: corsHeaders(),
    body: JSON.stringify({ error: message }),
  };
}

export function serverError(message = "Internal server error"): APIGatewayProxyResult {
  return {
    statusCode: 500,
    headers: corsHeaders(),
    body: JSON.stringify({ error: message }),
  };
}

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  };
}
