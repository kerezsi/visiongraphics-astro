// functions/api/contact.ts
//
// Cloudflare Pages Function — handles POST submissions from the /contact/
// form and forwards them as email via Resend.
//
// URL: /api/contact (auto-routed by file path)
//
// Required Cloudflare Pages environment variables (set in the Pages dashboard
// under Settings → Environment variables → Production):
//   RESEND_API_KEY  — API key from https://resend.com (encrypt as a secret)
//   CONTACT_TO      — destination address (e.g. info@visiongraphics.hu)
//   CONTACT_FROM    — verified sender (e.g. contact@visiongraphics.hu)
//                     The domain must be verified in Resend.
//
// Local testing (optional):
//   npx wrangler pages dev dist \
//     --binding RESEND_API_KEY=re_xxx \
//     --binding CONTACT_TO=info@visiongraphics.hu \
//     --binding CONTACT_FROM=contact@visiongraphics.hu

interface Env {
  RESEND_API_KEY: string;
  CONTACT_TO: string;
  CONTACT_FROM: string;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const data = await ctx.request.formData();

    // Honeypot — if filled by a bot, return success silently
    if ((data.get('_gotcha') ?? '').toString().trim()) {
      return json({ ok: true });
    }

    const name        = str(data.get('name'));
    const email       = str(data.get('email'));
    const company     = str(data.get('company'));
    const projectType = str(data.get('project_type'));
    const message     = str(data.get('message'));
    const deadline    = str(data.get('deadline'));

    if (!name || !email || !message) {
      return json({ ok: false, error: 'Missing required fields' }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ ok: false, error: 'Invalid email' }, 400);
    }
    if (message.length > 10_000) {
      return json({ ok: false, error: 'Message too long' }, 413);
    }

    const subjectSuffix = projectType ? prettyProjectType(projectType) : 'general enquiry';
    const subject = `Contact form — ${subjectSuffix}`;

    const text = [
      `From:        ${name} <${email}>`,
      company     ? `Company:     ${company}`                       : null,
      projectType ? `Project:     ${prettyProjectType(projectType)}` : null,
      deadline    ? `Deadline:    ${deadline}`                      : null,
      '',
      '─── Message ─────────────────────────────',
      message,
    ].filter(Boolean).join('\n');

    const html = [
      `<p><strong>From:</strong> ${esc(name)} &lt;${esc(email)}&gt;</p>`,
      company     ? `<p><strong>Company:</strong> ${esc(company)}</p>` : '',
      projectType ? `<p><strong>Project type:</strong> ${esc(prettyProjectType(projectType))}</p>` : '',
      deadline    ? `<p><strong>Deadline:</strong> ${esc(deadline)}</p>` : '',
      '<hr>',
      `<p style="white-space: pre-wrap; font-family: ui-sans-serif, system-ui, sans-serif;">${esc(message)}</p>`,
    ].filter(Boolean).join('\n');

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ctx.env.RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:     ctx.env.CONTACT_FROM,
        to:       [ctx.env.CONTACT_TO],
        reply_to: email,
        subject,
        text,
        html,
      }),
    });

    if (!resendResp.ok) {
      const body = await resendResp.text();
      console.error('Resend API error', resendResp.status, body);
      return json({ ok: false, error: 'Email service error' }, 502);
    }

    return json({ ok: true });
  } catch (err) {
    console.error('Contact form error', err);
    return json({ ok: false, error: 'Server error' }, 500);
  }
};

// ── helpers ────────────────────────────────────────────────────────────────

function str(v: FormDataEntryValue | null): string {
  return (v ?? '').toString().trim();
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Map the form's <select> values to readable strings used in the email
function prettyProjectType(v: string): string {
  const map: Record<string, string> = {
    'architectural-visualization': 'Architectural Visualization',
    'large-scale':                  'Large-Scale / Infrastructure',
    'product':                      'Product Visualization',
    'vr':                           'VR / Real-time Experience',
    'animation':                    'Animation',
    'ai-services':                  'AI-Enhanced Services',
    'workflow':                     'Workflow Optimization / 3ds Max Tools',
    'other':                        'Other',
  };
  return map[v] ?? v;
}
