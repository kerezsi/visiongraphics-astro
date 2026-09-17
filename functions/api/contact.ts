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
//   TURNSTILE_SECRET   — the Turnstile widget's secret (encrypt as a secret). Never in git.
//   TURNSTILE_HOSTNAMES — comma-separated frontend hostnames siteverify must report, per
//                     environment: Production "visiongraphics.eu,www.visiongraphics.eu";
//                     Preview "develop.visiongraphics-astro.pages.dev,visiongraphics-astro.pages.dev".
//                     Never localhost in a production value. Unset → every submission is refused.
//                     The public site key is in src/pages/[lang]/contact/index.astro.
//
// Local testing (optional):
//   npx wrangler pages dev dist \
//     --binding RESEND_API_KEY=re_xxx \
//     --binding CONTACT_TO=info@visiongraphics.hu \
//     --binding CONTACT_FROM=contact@visiongraphics.hu \
//     --binding TURNSTILE_SECRET=... --binding TURNSTILE_HOSTNAMES=localhost

interface Env {
  RESEND_API_KEY: string;
  CONTACT_TO: string;
  CONTACT_FROM: string;
  TURNSTILE_SECRET?: string;
  TURNSTILE_HOSTNAMES?: string;
}

// Must match data-action / the `action` passed to turnstile.render() on the contact page.
const TURNSTILE_ACTION = 'contact';

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const data = await ctx.request.formData();

    // Honeypot — if filled by a bot, return success silently
    if ((data.get('_gotcha') ?? '').toString().trim()) {
      return json({ ok: true });
    }

    // Turnstile gate — canonical siteverify: success + expected action + approved hostname.
    // Everything below runs unchanged once the token passes.
    const token = str(data.get('cf-turnstile-response'));
    if (!(await turnstileOk(ctx.env, token, ctx.request.headers.get('CF-Connecting-IP')))) {
      return json({ ok: false, error: 'Verification failed' }, 403);
    }

    const name        = str(data.get('name'));
    const email       = str(data.get('email'));
    const company     = str(data.get('company'));
    const projectType = str(data.get('project_type'));
    const message     = str(data.get('message'));
    const deadline    = str(data.get('deadline'));
    const lang        = str(data.get('lang')).slice(0, 5) || 'en';

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
    const subject = `Contact form (${lang.toUpperCase()}) — ${subjectSuffix}`;

    const text = [
      `From:        ${name} <${email}>`,
      `Language:    ${lang}`,
      company     ? `Company:     ${company}`                       : null,
      projectType ? `Project:     ${prettyProjectType(projectType)}` : null,
      deadline    ? `Deadline:    ${deadline}`                      : null,
      '',
      '─── Message ─────────────────────────────',
      message,
    ].filter(Boolean).join('\n');

    const html = [
      `<p><strong>From:</strong> ${esc(name)} &lt;${esc(email)}&gt;</p>`,
      `<p><strong>Language:</strong> ${esc(lang)}</p>`,
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

async function turnstileOk(env: Env, token: string, ip: string | null): Promise<boolean> {
  const expectedHostnames = new Set((env.TURNSTILE_HOSTNAMES ?? '').split(',').map((h) => h.trim()).filter(Boolean));
  if (!env.TURNSTILE_SECRET || expectedHostnames.size === 0) return false; // misconfigured → fail closed
  if (!token || token.length > 2048) return false;

  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
  if (ip) body.set('remoteip', ip);
  let result: { success?: boolean; action?: string; hostname?: string };
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10_000),
      body,
    });
    if (!res.ok) return false;
    result = await res.json();
  } catch {
    return false;
  }
  return result.success === true && result.action === TURNSTILE_ACTION && expectedHostnames.has(result.hostname ?? '');
}

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
