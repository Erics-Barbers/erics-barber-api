import { emailTheme } from './email-theme';

type EmailAction = {
  href: string;
  label: string;
};

type EmailDetail = {
  label: string;
  value: string;
};

type BrandedEmailInput = {
  action?: EmailAction;
  details?: EmailDetail[];
  intro: string;
  preheader?: string;
  secondaryText?: string;
  title: string;
};

export function renderBrandedEmail({
  action,
  details = [],
  intro,
  preheader,
  secondaryText,
  title,
}: BrandedEmailInput): string {
  const detailRows = details
    .map(
      (detail) => `
        <tr>
          <td style="padding: 14px 0; border-top: 1px solid ${emailTheme.colors.border}; color: ${emailTheme.colors.muted}; font-size: 14px;">
            ${escapeHtml(detail.label)}
          </td>
          <td align="right" style="padding: 14px 0; border-top: 1px solid ${emailTheme.colors.border}; color: ${emailTheme.colors.text}; font-size: 14px; font-weight: 700;">
            ${escapeHtml(detail.value)}
          </td>
        </tr>
      `,
    )
    .join('');

  const actionMarkup = action
    ? `
      <tr>
        <td style="padding-top: 28px;">
          <a href="${escapeAttribute(action.href)}" style="display: inline-block; background: ${emailTheme.colors.buttonBackground}; color: ${emailTheme.colors.buttonText}; border-radius: ${emailTheme.radius.button}; padding: 14px 24px; font-size: 16px; font-weight: 700; text-decoration: none;">
            ${escapeHtml(action.label)}
          </a>
        </td>
      </tr>
    `
    : '';

  const secondaryMarkup = secondaryText
    ? `
      <tr>
        <td style="padding-top: 18px; color: ${emailTheme.colors.muted}; font-size: 14px; line-height: 22px;">
          ${escapeHtml(secondaryText)}
        </td>
      </tr>
    `
    : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin: 0; padding: 0; background: ${emailTheme.colors.background}; font-family: ${emailTheme.fontFamily};">
    ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${escapeHtml(preheader)}</div>` : ''}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${emailTheme.colors.background}; margin: 0; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">
            <tr>
              <td style="padding-bottom: 18px; color: ${emailTheme.colors.text}; font-size: 30px; font-weight: 700;">
                Eric's Barbers
              </td>
            </tr>
            <tr>
              <td style="background: ${emailTheme.colors.panel}; border: 1px solid ${emailTheme.colors.border}; border-radius: ${emailTheme.radius.card}; padding: 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color: ${emailTheme.colors.text}; font-size: 28px; font-weight: 700; line-height: 34px;">
                      ${escapeHtml(title)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 14px; color: ${emailTheme.colors.muted}; font-size: 16px; line-height: 24px;">
                      ${escapeHtml(intro)}
                    </td>
                  </tr>
                  ${
                    detailRows
                      ? `<tr><td style="padding-top: 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows}</table></td></tr>`
                      : ''
                  }
                  ${actionMarkup}
                  ${secondaryMarkup}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 18px 4px 0; color: ${emailTheme.colors.muted}; font-size: 12px; line-height: 18px;">
                This email was sent by Eric's Barbers. If you were not expecting this message, you can ignore it.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
