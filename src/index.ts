export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return Response.json({ ok: true });
    }

    if (request.method === 'POST' && url.pathname === '/api/apply') {
      return Response.json({ ok: false, error: 'Not implemented' });
    }

    return new Response('Not Found', { status: 404 });
  }
};
