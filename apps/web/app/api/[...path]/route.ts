const getApiBaseUrl = () =>
  process.env.API_BASE_URL ?? `http://127.0.0.1:${process.env.API_PORT ?? "3001"}`;

type ProxyRouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

const excludedRequestHeaders = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "transfer-encoding",
  "upgrade"
]);

const excludedResponseHeaders = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "transfer-encoding",
  "upgrade"
]);

const proxyRequest = async (request: Request, context: ProxyRouteContext) => {
  const { path = [] } = await context.params;
  const upstreamUrl = new URL(path.join("/"), `${getApiBaseUrl().replace(/\/$/, "")}/`);
  upstreamUrl.search = new URL(request.url).search;

  const headers = new Headers(request.headers);
  for (const header of excludedRequestHeaders) {
    headers.delete(header);
  }

  const response = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    cache: "no-store"
  });

  const responseHeaders = new Headers(response.headers);
  for (const header of excludedResponseHeaders) {
    responseHeaders.delete(header);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  });
};

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
