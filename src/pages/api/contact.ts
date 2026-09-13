import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

export const POST: APIRoute = async ({ request }) => {
    const data = await request.formData();

    const name    = (data.get('name')    as string | null)?.trim() ?? '';
    const email   = (data.get('email')   as string | null)?.trim() ?? '';
    const phone   = (data.get('phone')   as string | null)?.trim() ?? '';
    const subject = (data.get('subject') as string | null)?.trim() ?? '';
    const message = (data.get('message') as string | null)?.trim() ?? '';

    // Basic validation
    if (!name || !email || !subject || !message) {
        return new Response(JSON.stringify({ error: 'Faltan campos obligatorios.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({ error: 'El correo electrónico no es válido.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Create transporter using env vars (import.meta.env for server-side runtime)
    const transporter = nodemailer.createTransport({
        host:   import.meta.env.SMTP_HOST,
        port:   Number(import.meta.env.SMTP_PORT ?? 587),
        secure: import.meta.env.SMTP_SECURE === 'true',
        auth: {
            user: import.meta.env.SMTP_USER,
            pass: import.meta.env.SMTP_PASS,
        },
    });

    try {
        await transporter.sendMail({
            from:    `"Playgrupo Web" <${import.meta.env.SMTP_USER}>`,
            to:      import.meta.env.CONTACT_TO,
            replyTo: email,
            subject: `[Contacto Web] ${subject} — ${name}`,
            html: `
                <h2 style="color:#ff7522">Nuevo mensaje desde el formulario de contacto</h2>
                <table cellpadding="8" style="border-collapse:collapse;width:100%;font-family:sans-serif">
                    <tr><td style="font-weight:bold;width:140px">Nombre</td><td>${name}</td></tr>
                    <tr style="background:#f9f9f9"><td style="font-weight:bold">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
                    <tr><td style="font-weight:bold">Teléfono</td><td>${phone || '—'}</td></tr>
                    <tr style="background:#f9f9f9"><td style="font-weight:bold">Asunto</td><td>${subject}</td></tr>
                    <tr><td style="font-weight:bold;vertical-align:top">Mensaje</td><td style="white-space:pre-wrap">${message}</td></tr>
                </table>
            `,
        });

        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error('[contact] sendMail error:', err);
        return new Response(JSON.stringify({ error: 'No se pudo enviar el mensaje. Intentá más tarde.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
