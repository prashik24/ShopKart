import nodemailer from 'nodemailer';
import { config } from '../config.js';

let transporter;

/** Create a transport once */
function getTransport() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.pass }
  });
  return transporter;
}

/** Sends a real email via SMTP (no test sandbox). */
export async function sendEmail({ to, subject, html, text }) {
  const t = getTransport();
  const info = await t.sendMail({
    from: config.smtp.from,
    to,
    subject,
    text,
    html
  });
  return info;
}

/* ------------------------------------------------------------------ */
/* -----------------  Order Confirmation Email HTML  ---------------- */
/* ------------------------------------------------------------------ */

/**
 * Build a bulletproof HTML email with inline-safe styles (no images).
 * Works well in Gmail/Outlook/iOS. Uses tables + inline CSS where needed.
 */
export function buildOrderEmail({ user, order }) {
  const currency = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const itemsRows = (order.items || [])
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 0 10px 0; vertical-align:top;">
          <div style="font:600 14px/1.3 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111827;">
            ${escapeHtml(i.title)}
          </div>
          <div style="font:400 12px/1.4 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#6B7280;">
            Qty: ${i.qty}
          </div>
        </td>
        <td align="right" style="padding:10px 0 10px 16px; white-space:nowrap; font:600 14px/1.3 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:#111827;">
          ${currency(i.price * i.qty)}
        </td>
      </tr>`
    )
    .join('');

  const payLabel =
    order.payment?.mode === 'UPI'
      ? `UPI${order.payment?.upiId ? ` (${escapeHtml(order.payment.upiId)})` : ''}`
      : 'Cash on Delivery';

  const addr = order.address || {};
  const addressHtml = `
    <div>${escapeHtml(addr.name || '')}</div>
    <div>${escapeHtml(addr.line1 || '')}</div>
    <div>${escapeHtml(addr.city || '')}, ${escapeHtml(addr.state || '')} ${escapeHtml(addr.zip || '')}</div>
    <div>Phone: ${escapeHtml(addr.phone || '')}</div>
  `;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Order Confirmation</title>
  </head>
  <body style="margin:0;padding:0;background:#F9FAFB;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F9FAFB;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:12px;border:1px solid #F3F4F6;">
            <tr>
              <td style="padding:20px 24px 8px 24px;">
                <!-- "Logo" as styled text (no image) -->
                <div style="font:800 20px/1 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111827;">
                  Shop<span style="color:#F59E0B">Kart</span>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:4px 24px 0 24px;">
                <h1 style="margin:12px 0 8px 0;font:700 22px/1.3 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111827;">
                  Order placed successfully!
                </h1>
                <p style="margin:0 0 16px 0;font:400 14px/1.6 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#374151;">
                  Your order <strong>${escapeHtml(order.id)}</strong> has been placed.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 8px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <!-- Items -->
                    <td style="padding:0;vertical-align:top;">
                      <div style="font:700 15px/1.3 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111827;margin:8px 0;">
                        Items
                      </div>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #F3F4F6;">
                        ${itemsRows || `
                          <tr><td style="padding:12px 0;font:400 14px 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#6B7280;">
                            No items listed.
                          </td></tr>`}
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:8px 0 0 0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #F3F4F6;border-radius:10px;">
                        <tr>
                          <td style="padding:12px 14px;">
                            <div style="font:700 14px/1.3 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111827;margin-bottom:8px;">
                              Summary
                            </div>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                              <tr>
                                <td style="font:400 13px/1.5 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#374151;padding:4px 0;">
                                  Payment
                                </td>
                                <td align="right" style="font:600 13px/1.5 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111827;padding:4px 0;">
                                  ${escapeHtml(payLabel)}
                                </td>
                              </tr>
                              <tr>
                                <td style="font:400 13px/1.5 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#374151;padding:4px 0;">
                                  Total
                                </td>
                                <td align="right" style="font:700 14px/1.5 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111827;padding:4px 0;">
                                  ${currency(order.total || 0)}
                                </td>
                              </tr>
                            </table>

                            <div style="font:700 14px/1.3 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111827;margin:12px 0 6px;">
                              Deliver to
                            </div>
                            <div style="font:400 13px/1.6 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#374151;">
                              ${addressHtml}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 24px 22px 24px;">
                <a href="${config.clientOrigin}/catalog"
                   style="display:inline-block;text-decoration:none;background:#F59E0B;color:#ffffff;border-radius:10px;padding:10px 16px;font:600 14px 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
                  Continue shopping
                </a>
              </td>
            </tr>

          </table>

          <div style="max-width:640px;padding:14px 10px 0 10px;font:400 12px/1.6 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#9CA3AF;">
            Thanks for shopping with <span style="font-weight:700;color:#111827;">Shop</span><span style="font-weight:800;color:#F59E0B;">Kart</span>.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Minimal plaintext fallback */
export function buildOrderText({ order }) {
  const lines = [];
  lines.push(`Order placed successfully!`);
  lines.push(`Order ID: ${order.id}`);
  lines.push(``);
  lines.push(`Items:`);
  (order.items || []).forEach((i) => {
    lines.push(`- ${i.title} x${i.qty}  ₹${i.price * i.qty}`);
  });
  lines.push(``);
  lines.push(`Payment: ${order.payment?.mode === 'UPI' ? `UPI (${order.payment?.upiId || ''})` : 'Cash on Delivery'}`);
  lines.push(`Total: ₹${order.total}`);
  lines.push(``);
  const a = order.address || {};
  lines.push(`Deliver to: ${a.name}`);
  lines.push(`${a.line1}`);
  lines.push(`${a.city}, ${a.state} ${a.zip}`);
  lines.push(`Phone: ${a.phone}`);
  return lines.join('\n');
}

/* ---------- helpers ---------- */

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
