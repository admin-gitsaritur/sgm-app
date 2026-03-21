import { config } from '../config.js';

/**
 * Configuração centralizada do sistema de emails.
 * TODAS as constantes visuais, URLs e textos ficam aqui.
 * Templates e rotas NUNCA devem ter hard-code de cores, logos ou textos.
 */
export const emailConfig = {

  // ── Marca ─────────────────────────────────────────────
  brand: {
    name: 'Saritur',
    system: 'SGM',
    systemFull: 'SGM — Sistema de Gestão de Metas',
    copyright: `© ${new Date().getFullYear()} Saritur. Todos os direitos reservados.`,
    footerText: 'Este é um email automático do SGM, por favor não responda.',
  },

  // ── Assets ────────────────────────────────────────────
  assets: {
    // Logo para o header do email (Carregado do S3/MinIO)
    logoUrl: process.env.EMAIL_LOGO_URL
      || `${config.minioUseSsl ? 'https' : 'http'}://${config.minioEndpoint}${config.minioPort === 443 || config.minioPort === 80 ? '' : ':' + config.minioPort}/${config.minioBucket}/brands/logo_saritur_branco.png`,

    // Favicon para clientes que suportam
    faviconUrl: process.env.EMAIL_FAVICON_URL
      || `${config.corsOrigin}/brands/favicon.ico`,
  },

  // ── Cores (extraídas dos design tokens do CSS) ────────
  colors: {
    primary: '#F37137',       // --saritur-orange / --primary
    primaryLight: '#FFF4EF',  // --accent (bg hover laranja)
    primaryDark: '#D95F27',   // primary hover
    brown: '#4E3205',         // --saritur-brown
    yellow: '#F6D317',        // --saritur-yellow

    // Backgrounds
    bgPage: '#FFFFFF',        // Fundo geral do email (branco limpo)
    bgCard: '#FFFFFF',        // Fundo do card central
    bgDetails: '#FAFAFA',     // Fundo da caixa de detalhes
    bgFooter: '#FFFFFF',      // Fundo do rodapé (branco)
    bgIconCircle: '#FFF3ED',  // Fundo do círculo do emoji

    // Textos
    textPrimary: '#4E3205',   // Títulos
    textBody: '#666666',      // Corpo
    textMuted: '#999999',     // Footer / disclaimer
    textHighlight: '#F37137', // Valores destacados

    // Bordas
    borderLight: '#F0F0F0',   // Borda do card de detalhes
    borderMedium: '#EAEAEA',  // Borda separadora / dashed
    borderHeader: '#EAEAEA',  // Borda inferior do header
  },

  // ── Tipografia ────────────────────────────────────────
  fonts: {
    family: "'Sora', Arial, sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&display=swap',
  },

  // ── URLs ──────────────────────────────────────────────
  urls: {
    app: config.corsOrigin || 'https://saritur-sgm-app.01brxh.easypanel.host',
    login: `${config.corsOrigin || 'https://saritur-sgm-app.01brxh.easypanel.host'}/login`,
  },

  // ── Layout ────────────────────────────────────────────
  layout: {
    maxWidth: '600px',
    borderRadius: '16px',
    borderRadiusInner: '12px',
    borderRadiusButton: '10px',
    paddingBody: '40px',
    paddingHeader: '32px 40px 24px',
    paddingFooter: '32px 40px',
    iconSize: '56px',
    iconFontSize: '28px',
    shadowCard: '0 8px 32px rgba(0,0,0,0.04)',
  },

} as const;

export type EmailConfig = typeof emailConfig;
