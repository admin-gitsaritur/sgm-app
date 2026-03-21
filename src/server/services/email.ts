import nodemailer from 'nodemailer';
import { emailConfig } from './email-config.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.saritur.com.br',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
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
      from: `"${emailConfig.brand.system} ${emailConfig.brand.name}" <${process.env.SMTP_USER}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    console.log(`[Email] ✅ Enviado para ${params.to}: ${params.subject}`);
  } catch (err) {
    console.error('[Email] ❌ Erro ao enviar:', err);
  }
}

/**
 * Engine base de geração de HTML para emails.
 * TODAS as cores, fontes, logos e textos vêm de emailConfig.
 * ZERO hard-code neste template.
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
  const { brand, assets, colors, fonts, layout } = emailConfig;
  const emoji = options.emoji || '✅';

  // ── Bloco: Ícone com emoji ──
  const iconHtml = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="width:${layout.iconSize};height:${layout.iconSize};background-color:${colors.bgIconCircle};border-radius:50%;text-align:center;vertical-align:middle;font-size:${layout.iconFontSize};line-height:${layout.iconSize};">
          ${emoji}
        </td>
      </tr>
    </table>`;

  // ── Bloco: Saudação ──
  const greetingHtml = options.greeting
    ? `<p style="font-size:15px;line-height:1.6;color:${colors.textBody};margin:0 0 16px;font-weight:300;">${options.greeting}</p>`
    : '';

  // ── Bloco: Texto principal ──
  const bodyHtml = `<p style="font-size:15px;line-height:1.6;color:${colors.textBody};margin:0 0 24px;font-weight:300;">${options.bodyText}</p>`;

  // ── Bloco: Detalhes (caixa cinza) ──
  const detailsHtml = options.details
    ? `<div style="background-color:${colors.bgDetails};border:1px solid ${colors.borderLight};border-radius:${layout.borderRadiusInner};padding:24px;margin-bottom:32px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${options.details.map((d, i) => {
          const isLast = i === options.details!.length - 1;
          const rowStyle = isLast
            ? `padding-top:16px;border-top:1px dashed ${colors.borderMedium};`
            : 'padding-bottom:16px;';
          const labelStyle = `display:block;color:${colors.textMuted};font-size:14px;margin-bottom:6px;`;
          const valueStyle = d.highlight
            ? `display:block;font-weight:700;color:${colors.textHighlight};font-size:18px;letter-spacing:1px;`
            : `display:block;color:${colors.textPrimary};font-weight:500;font-size:15px;`;
            
          return `<tr>
            <td align="center" style="${rowStyle}">
              <span style="${labelStyle}">${d.label}:</span>
              <span style="${valueStyle}">${d.value}</span>
            </td>
          </tr>`;
        }).join('')}
        </table>
      </div>`
    : '';

  // ── Bloco: Texto extra ──
  const extraHtml = options.extraText
    ? `<p style="font-size:14px;color:${colors.textBody};margin:0 0 32px;line-height:1.6;">${options.extraText}</p>`
    : '';

  // ── Bloco: Botão CTA ──
  const ctaHtml = options.ctaButton
    ? `<a href="${options.ctaButton.url}" style="display:block;width:100%;text-align:center;background-color:${colors.primary};color:white;text-decoration:none;padding:16px 0;border-radius:${layout.borderRadiusButton};font-weight:600;font-size:15px;box-sizing:border-box;">${options.ctaButton.label}</a>`
    : '';

  // ── Documento completo ──
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title} - ${brand.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fonts.googleFontsUrl}" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:${colors.bgPage};font-family:${fonts.family};color:${colors.textPrimary};-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.bgPage};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table cellpadding="0" cellspacing="0" border="0" style="max-width:${layout.maxWidth};width:100%;background-color:${colors.bgCard};border-radius:${layout.borderRadius};box-shadow:${layout.shadowCard};">

          <!-- Header com Logo -->
          <tr>
            <td style="padding:${layout.paddingHeader};text-align:center;background-color:${colors.bgCard};border-radius:${layout.borderRadius} ${layout.borderRadius} 0 0;border-bottom:1px solid ${colors.borderHeader};">
              <img src="${assets.logoUrl}" alt="${brand.name}" style="max-height:96px;width:auto;" />
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:${layout.paddingBody};">
              ${iconHtml}
              <h1 style="font-size:22px;font-weight:600;color:${colors.textPrimary};margin:0 0 16px;line-height:1.3;">${options.title}</h1>
              ${greetingHtml}
              ${bodyHtml}
              ${detailsHtml}
              ${extraHtml}
              ${ctaHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;border-top:1px solid ${colors.borderLight};border-radius:0 0 ${layout.borderRadius} ${layout.borderRadius};">
              <p style="font-size:11px;color:${colors.textMuted};margin:0 0 4px;">${brand.copyright}</p>
              <p style="font-size:11px;color:${colors.textMuted};margin:0;">Desenvolvido para <span style="color:${colors.primary};font-weight:600;">${brand.name}</span></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Template: Boas-vindas — Novo usuário criado pelo admin.
 */
export function buildWelcomeEmailHtml(params: {
  nomeUsuario: string;
  email: string;
  role: string;
  senhaTemporaria: string;
  criadoPorNome: string;
}): string {
  const { brand, urls } = emailConfig;

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador',
    GESTOR: 'Gestor',
    OPERADOR: 'Operador',
    VISUALIZADOR: 'Visualizador',
  };

  return buildEmailHtml({
    title: `Bem-vindo ao ${brand.system}!`,
    emoji: '👋',
    greeting: `Olá, ${params.nomeUsuario}!`,
    bodyText: `Sua conta no <strong>${brand.systemFull}</strong> foi criada por ${params.criadoPorNome}. Abaixo estão seus dados de acesso:`,
    details: [
      { label: 'Email de acesso', value: params.email },
      { label: 'Perfil', value: roleLabels[params.role] || params.role },
      { label: 'Senha temporária', value: params.senhaTemporaria, highlight: true },
    ],
    extraText: '⚠️ <strong>Importante:</strong> No primeiro login, você será solicitado a criar uma nova senha. Nunca compartilhe sua senha com terceiros.',
    ctaButton: {
      label: 'Acessar o SGM',
      url: urls.login,
    },
  });
}

/**
 * Template: Reset de senha pelo admin.
 */
export function buildAdminResetEmailHtml(params: {
  nomeUsuario: string;
  senhaTemporaria: string;
  resetadoPorNome: string;
}): string {
  const { brand, urls } = emailConfig;

  return buildEmailHtml({
    title: 'Senha Redefinida',
    emoji: '🔑',
    greeting: `Olá, ${params.nomeUsuario}!`,
    bodyText: `Sua senha no <strong>${brand.systemFull}</strong> foi redefinida pelo administrador ${params.resetadoPorNome}.`,
    details: [
      { label: 'Sua nova senha temporária', value: params.senhaTemporaria, highlight: true },
    ],
    extraText: 'Ao fazer login com essa senha, você será redirecionado para criar uma nova senha pessoal. Se você não reconhece esta ação, entre em contato com o administrador do sistema.',
    ctaButton: {
      label: 'Fazer Login',
      url: urls.login,
    },
  });
}

/**
 * Template: Esqueci minha senha (self-service).
 */
export function buildForgotPasswordEmailHtml(params: {
  nomeUsuario: string;
  senhaTemporaria: string;
}): string {
  const { brand, urls } = emailConfig;

  return buildEmailHtml({
    title: 'Redefinição de Senha',
    emoji: '🔑',
    greeting: `Olá, ${params.nomeUsuario}!`,
    bodyText: `Recebemos uma solicitação de redefinição de senha para sua conta no <strong>${brand.systemFull}</strong>.`,
    details: [
      { label: 'Sua nova senha temporária', value: params.senhaTemporaria, highlight: true },
    ],
    extraText: 'Ao fazer login com essa senha, você será redirecionado para criar uma nova senha. Se você não solicitou esta redefinição, entre em contato com o administrador.',
    ctaButton: {
      label: 'Acessar o SGM',
      url: urls.login,
    },
  });
}
