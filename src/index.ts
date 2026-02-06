export interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
  ADMIN_EMAIL?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_SECURE?: string;
  SMTP_FROM?: string;
  REGISTRY_TEAM_EMAIL?: string;
}

async function sendApplicationEmails(data: any, env: Env): Promise<void> {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: [env.ADMIN_EMAIL],
        subject: `New Virelian Application — ${data.full_name}`,
        html: `
    <h2>New Application Submitted</h2>
    <p><strong>Name:</strong> ${data.full_name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
    <p><strong>Location:</strong> ${data.location || 'N/A'}</p>
    <p><strong>Affiliation:</strong> ${data.affiliation || 'N/A'}</p>
    <p><strong>Role:</strong> ${data.role || 'N/A'}</p>
    <p><strong>Beats:</strong> ${data.beats || 'N/A'}</p>
    <p><strong>Portfolio:</strong> ${data.portfolio_links || 'N/A'}</p>
    <p><strong>Statement:</strong></p>
    <p>${data.statement}</p>
  `
      })
    });
  } catch (error) {
    console.error('Resend email failed:', error);
  }
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
