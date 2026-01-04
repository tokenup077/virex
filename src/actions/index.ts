import { defineAction } from 'astro:actions';
import { z } from 'zod';
import { Resend } from 'resend';

export async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = import.meta.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token) return false;
  try {
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await resp.json();
    return !!data.success;
  } catch {
    return false;
  }
}

const contactInput = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(1).max(2000),
  token: z.string(),
});

export const actions = {
  contactSubmit: defineAction({
    accept: 'form',
    input: contactInput,
    handler: async (input, ctx) => {
      // 1) Turnstile verify
      const ok = await verifyTurnstile(input.token);
      if (!ok) {
        throw new Error('turnstile_failed');
      }

      // 2) Send email via Resend
      const resendApiKey = import.meta.env.RESEND_API_KEY;
      const to = import.meta.env.SITE_CONTACT_TO_EMAIL;
      if (!resendApiKey || !to) {
        throw new Error('server_misconfigured');
      }

      const resend = new Resend(resendApiKey);
      const from = 'onboarding@resend.dev'; // test sender; replace in production
      const subject = `[Contact] ${input.name}`;
      const text = `${input.name} <${input.email}>
\n${input.message}`;

      await resend.emails.send({ to, from, subject, text });

      // 3) Redirect to thanks
      return ctx.redirect('/contact/thanks');
    },
  }),
};

