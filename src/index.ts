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
  ADMIN_TOKEN?: string;
  SEND_DECISION_EMAILS?: string;
}

type ApplicationInput = {
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  affiliation?: string;
  role?: string;
  beats?: string;
  portfolio_links?: string;
  statement: string;
};

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

function isAuthorized(request: Request, env: Env): boolean {
  if (!env.ADMIN_TOKEN) {
    return false;
  }

  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  return token.length > 0 && token === env.ADMIN_TOKEN;
}

function createCredentialId(): string {
  const value = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `VRL-${value}`;
}

async function sendApplicationEmails(data: ApplicationInput, env: Env): Promise<void> {
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

async function sendDecisionEmail(
  env: Env,
  type: 'approved' | 'rejected',
  applicant: { email: string; full_name: string },
  details: { credentialId?: string; verifyLink?: string }
): Promise<void> {
  if (env.SEND_DECISION_EMAILS !== 'true') {
    return;
  }

  if (!env.RESEND_API_KEY || !env.MAIL_FROM || !applicant.email) {
    console.warn('Decision email skipped due to missing config or recipient');
    return;
  }

  const approvedHtml = `
    <h2>Your Virelian application has been approved</h2>
    <p>Hello ${applicant.full_name},</p>
    <p>Congratulations—your application has been approved.</p>
    <p><strong>Credential ID:</strong> ${details.credentialId}</p>
    <p>You can verify your credential here: <a href="${details.verifyLink}">${details.verifyLink}</a></p>
  `;

  const rejectedHtml = `
    <h2>Update on your Virelian application</h2>
    <p>Hello ${applicant.full_name},</p>
    <p>Thank you for applying to Virelian. At this time, we are unable to approve your application.</p>
    <p>You may apply again in the future with additional supporting information.</p>
  `;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: [applicant.email],
        subject:
          type === 'approved' ? 'Your Virelian application is approved' : 'Your Virelian application status update',
        html: type === 'approved' ? approvedHtml : rejectedHtml
      })
    });
  } catch (error) {
    console.error(`Resend ${type} email failed:`, error);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return json({ ok: true });
    }

    if (request.method === 'GET' && url.pathname === '/api/registry') {
      const { results } = await env.DB.prepare(`
        SELECT credential_id, affiliation, role, beats, reviewed_at
        FROM applications
        WHERE status='approved' AND credential_id IS NOT NULL
        ORDER BY reviewed_at DESC
        LIMIT 500
      `).all();

      return json({ ok: true, results: results || [] });
    }

    if (request.method === 'GET' && url.pathname === '/api/registry/verify') {
      const credentialId = (url.searchParams.get('credential_id') || '').trim();

      if (!credentialId) {
        return json({ ok: true, found: false });
      }

      const result = await env.DB.prepare(`
        SELECT credential_id, status, reviewed_at, affiliation, role, beats
        FROM applications
        WHERE credential_id=? AND status='approved'
        LIMIT 1
      `)
        .bind(credentialId)
        .first();

      if (!result) {
        return json({ ok: true, found: false });
      }

      return json({ ok: true, found: true, record: result });
    }

    if (request.method === 'POST' && url.pathname === '/api/apply') {
      const data = (await request.json()) as ApplicationInput;

      await sendApplicationEmails(data, env);

      try {
        await env.DB.prepare(`
INSERT INTO applications (
  status,
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
VALUES ('submitted', ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        return json({ ok: false, error: 'Database insert failed' }, 500);
      }

      return json({
        ok: true,
        application_id: crypto.randomUUID()
      });
    }

    if (url.pathname.startsWith('/api/admin/')) {
      if (!isAuthorized(request, env)) {
        return json({ ok: false, error: 'Unauthorized' }, 401);
      }

      if (request.method === 'GET' && url.pathname === '/api/admin/applications') {
        const requested = (url.searchParams.get('status') || 'submitted').trim();
        const status = ['submitted', 'approved', 'rejected'].includes(requested) ? requested : 'submitted';

        const { results } = await env.DB.prepare(`
          SELECT id, created_at, status, reviewed_at, credential_id, full_name, email, phone, location, affiliation, role, beats, portfolio_links, statement, admin_notes
          FROM applications
          WHERE status=?
          ORDER BY created_at DESC
          LIMIT 500
        `)
          .bind(status)
          .all();

        return json({ ok: true, results: results || [] });
      }

      if (request.method === 'POST' && url.pathname === '/api/admin/approve') {
        const body = (await request.json()) as { id?: string; admin_notes?: string };
        const id = body?.id?.trim();

        if (!id) {
          return json({ ok: false, error: 'Missing id' }, 400);
        }

        const credentialId = createCredentialId();
        const now = new Date().toISOString();
        const adminNotes = body.admin_notes || null;

        const existing = await env.DB.prepare('SELECT email, full_name FROM applications WHERE id=? LIMIT 1').bind(id).first<{
          email: string;
          full_name: string;
        }>();

        const updateResult = await env.DB.prepare(`
          UPDATE applications
          SET status='approved', reviewed_at=?, updated_at=?, credential_id=?, admin_notes=?
          WHERE id=?
        `)
          .bind(now, now, credentialId, adminNotes, id)
          .run();

        if (!updateResult.success || (updateResult.meta?.changes || 0) === 0) {
          return json({ ok: false, error: 'Application not found' }, 404);
        }

        if (existing?.email) {
          const verifyLink = `${url.origin}/api/registry/verify?credential_id=${encodeURIComponent(credentialId)}`;
          await sendDecisionEmail(env, 'approved', existing, { credentialId, verifyLink });
        }

        return json({ ok: true, id, credential_id: credentialId });
      }

      if (request.method === 'POST' && url.pathname === '/api/admin/reject') {
        const body = (await request.json()) as { id?: string; admin_notes?: string };
        const id = body?.id?.trim();

        if (!id) {
          return json({ ok: false, error: 'Missing id' }, 400);
        }

        const now = new Date().toISOString();
        const adminNotes = body.admin_notes || null;

        const existing = await env.DB.prepare('SELECT email, full_name FROM applications WHERE id=? LIMIT 1').bind(id).first<{
          email: string;
          full_name: string;
        }>();

        const updateResult = await env.DB.prepare(`
          UPDATE applications
          SET status='rejected', reviewed_at=?, updated_at=?, admin_notes=?
          WHERE id=?
        `)
          .bind(now, now, adminNotes, id)
          .run();

        if (!updateResult.success || (updateResult.meta?.changes || 0) === 0) {
          return json({ ok: false, error: 'Application not found' }, 404);
        }

        if (existing?.email) {
          await sendDecisionEmail(env, 'rejected', existing, {});
        }

        return json({ ok: true, id });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};
