import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.saritur.com.br',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // SSL
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
    },
});

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
    if (!process.env.SMTP_USER) {
        console.warn('[Email] SMTP_USER não configurado. Email não enviado.');
        return;
    }

    try {
        await transporter.sendMail({
            from: `"SGM Saritur" <${process.env.SMTP_USER}>`,
            to: params.to,
            subject: params.subject,
            html: params.html,
        });
        console.log(`[Email] Enviado para ${params.to}: ${params.subject}`);
    } catch (err) {
        console.error('[Email] Erro ao enviar:', err);
    }
}

/**
 * Gera o HTML do email usando o template padrão Saritur.
 * Adaptado do saritur-estornos/src/lib/sendEmail.ts
 */
export function buildEmailHtml(options: {
    title: string;
    emoji?: string;
    greeting?: string;
    bodyText: string;
    details?: Array<{ label: string; value: string; highlight?: boolean }>;
    extraText?: string;
    ctaButton?: { label: string; url: string };
}): string {
    const currentYear = new Date().getFullYear();
    const logoUrl = 'https://estorno.saritur.com.br/media/logo_saritur_branco.png';
    const emoji = options.emoji || '✅';

    const iconHtml = `<table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;"><tr><td style="width:56px;height:56px;background-color:#FFF3ED;border-radius:50%;text-align:center;vertical-align:middle;font-size:28px;line-height:56px;">${emoji}</td></tr></table>`;

    const greetingHtml = options.greeting
        ? `<p style="font-size:15px;line-height:1.6;color:#666;margin:0 0 16px;font-weight:300;">${options.greeting}</p>`
        : '';

    const bodyHtml = `<p style="font-size:15px;line-height:1.6;color:#666;margin:0 0 24px;font-weight:300;">${options.bodyText}</p>`;

    const detailsHtml = options.details
        ? `<div style="background-color:#FAFAFA;border:1px solid #F0F0F0;border-radius:12px;padding:24px;margin-bottom:32px;">
        ${options.details.map((d, i) => {
            const isLast = i === options.details!.length - 1;
            const rowStyle = isLast
                ? 'display:flex;justify-content:space-between;padding-top:16px;border-top:1px dashed #EAEAEA;font-weight:600;font-size:16px;color:#4E3205;'
                : 'display:flex;justify-content:space-between;margin-bottom:16px;font-size:14px;';
            const valueStyle = d.highlight ? 'font-weight:600;color:#F37137;text-align:right;' : 'color:#333;font-weight:400;text-align:right;';
            return `<div style="${rowStyle}">
            <span style="color:#888;">${d.label}</span>
            <span style="${valueStyle}">${d.value}</span>
          </div>`;
        }).join('')}
      </div>`
        : '';

    const extraHtml = options.extraText
        ? `<p style="font-size:14px;color:#666;margin:0 0 32px;">${options.extraText}</p>`
        : '';

    const ctaHtml = options.ctaButton
        ? `<a href="${options.ctaButton.url}" style="display:block;width:100%;text-align:center;background-color:#F37137;color:#FFFFFF;text-decoration:none;padding:16px 0;border-radius:10px;font-weight:600;font-size:15px;box-sizing:border-box;">${options.ctaButton.label}</a>`
        : '';

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title} - Saritur</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#F7F7F9;font-family:'Sora',Arial,sans-serif;color:#333;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F7F9;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.04);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;background-color:#F7F7F9;border-radius:16px 16px 0 0;border-bottom:1px solid #EAEAEA;">
              <img src="${logoUrl}" alt="Saritur" style="max-height:48px;width:auto;" />
            </td>
          </tr>
          <!-- Corpo -->
          <tr>
            <td style="padding:40px;">
              ${iconHtml}
              <h1 style="font-size:22px;font-weight:600;color:#4E3205;margin:0 0 16px;line-height:1.3;">${options.title}</h1>
              ${greetingHtml}
              ${bodyHtml}
              ${detailsHtml}
              ${extraHtml}
              ${ctaHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px;background-color:#FAFAFA;text-align:center;border-top:1px solid #EAEAEA;border-radius:0 0 16px 16px;">
              <p style="font-size:12px;color:#999;margin:0 0 8px;">&copy; ${currentYear} Saritur. Todos os direitos reservados.</p>
              <p style="font-size:12px;color:#999;margin:0;">Este é um email automático, por favor não responda.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
