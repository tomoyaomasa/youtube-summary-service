import { APIGatewayProxyEvent } from "aws-lambda";

export function verifyAdmin(event: APIGatewayProxyEvent): boolean {
  const authHeader = event.headers["Authorization"] || event.headers["authorization"];
  if (!authHeader) return false;

  const [scheme, encoded] = authHeader.split(" ");
  if (scheme !== "Basic" || !encoded) return false;

  const decoded = Buffer.from(encoded, "base64").toString("utf-8");
  const [, password] = decoded.split(":");

  return password === process.env.ADMIN_PASSWORD;
}
