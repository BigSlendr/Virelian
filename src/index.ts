export interface Env {
  DB: D1Database;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_SECURE?: string;
  SMTP_FROM?: string;
  REGISTRY_TEAM_EMAIL?: string;
}

async function sendApplicationEmails(data: any, _env: Env): Promise<void> {
  // Existing email workflow placeholder; keep invocation in POST /api/apply
  // so email and database paths both execute.
  return;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return Response.json({ ok: true });
    }

    if (request.method === 'POST' && url.pathname === '/api/apply') {
      const data = await request.json();

      await sendApplicationEmails(data, env);

      try {
        await env.DB.prepare(`
INSERT INTO applications (
  full_name,
  email,
  phone,
  location,
  affiliation,
  beats,
  role,
  portfolio_links,
  statement
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
          .bind(
            data.full_name,
            data.email,
            data.phone,
            data.location,
            data.affiliation,
            data.beats,
            data.role,
            data.portfolio_links,
            data.statement
          )
          .run();
      } catch (error) {
        console.error('D1 INSERT FAILED:', error);
        return Response.json({ ok: false, error: 'Database insert failed' }, { status: 500 });
      }

      return Response.json({
        ok: true,
        application_id: crypto.randomUUID()
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};
