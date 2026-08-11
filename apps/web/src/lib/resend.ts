import { Resend } from "resend";

// Resend's sandbox sender — works with no domain setup. Swap to a real
// "alertes@scout.app"-style address once a domain is verified in Resend,
// before going to production.
const FROM_ADDRESS = "Scout <onboarding@resend.dev>";

let client: Resend | null = null;

function getClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

export interface PriceDropAlert {
  to: string;
  productTitle: string;
  merchantName: string;
  previousPrice: number;
  newPrice: number;
  currency: string;
  productUrl: string;
}

export async function sendPriceDropAlert(alert: PriceDropAlert): Promise<void> {
  const resend = getClient();

  const formattedNew = `${alert.newPrice.toFixed(2)} ${alert.currency}`;
  const formattedPrevious = `${alert.previousPrice.toFixed(2)} ${alert.currency}`;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: alert.to,
    subject: `Le prix a baissé : ${alert.productTitle}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #565b4f;">Scout — alerte prix</p>
        <h1 style="font-size: 20px; margin: 8px 0;">${escapeHtml(alert.productTitle)}</h1>
        <p style="color: #565b4f; margin: 0 0 16px;">${escapeHtml(alert.merchantName)}</p>
        <p style="margin: 0 0 4px;"><s style="color: #565b4f;">${formattedPrevious}</s></p>
        <p style="font-size: 24px; font-weight: 700; color: #ff4a26; margin: 0 0 20px;">${formattedNew}</p>
        <a href="${alert.productUrl}" style="display: inline-block; background: #ff4a26; color: #fff8f4; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Voir le produit
        </a>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
