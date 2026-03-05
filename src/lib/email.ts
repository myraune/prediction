import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM_EMAIL = "Viking Market <notifications@viking-market.com>";

export async function sendMarketResolvedEmail(params: {
  to: string;
  userName: string;
  marketTitle: string;
  resolution: "YES" | "NO";
  marketId: string;
}) {
  const { to, userName, marketTitle, resolution, marketId } = params;
  const baseUrl = process.env.NEXTAUTH_URL || "https://viking-market.com";
  const marketUrl = `${baseUrl}/markets/${marketId}`;

  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping market resolved email");
    return { error: "Email not configured" };
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Market Resolved: ${marketTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 20px; font-weight: 700; color: #101820; margin: 0;">Viking Market</h1>
          </div>
          <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Market Resolved</p>
            <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #101820; line-height: 1.4;">${marketTitle}</h2>
            <div style="display: inline-block; background: ${resolution === "YES" ? "#22c55e" : "#ef4444"}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">
              Resolved: ${resolution}
            </div>
          </div>
          <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 16px;">
            Hi ${userName},<br><br>
            A market you may be interested in has been resolved. Check your portfolio to see if your predictions paid off!
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${marketUrl}" style="display: inline-block; background: #5adbb5; color: #101820; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600;">
              View Market Result
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
            You received this because you have notifications enabled on Viking Market.
            <br />
            <a href="${baseUrl}/profile" style="color: #6b7280;">Manage preferences</a>
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send market resolved email:", error);
    return { error: "Failed to send email" };
  }
}

export async function sendWaitlistUpdateEmail(params: {
  to: string;
  name: string | null;
  marketTitle: string;
  resolution: "YES" | "NO";
  marketId: string;
}) {
  const { to, name, marketTitle, resolution, marketId } = params;
  const baseUrl = process.env.NEXTAUTH_URL || "https://viking-market.com";
  const marketUrl = `${baseUrl}/markets/${marketId}`;

  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping waitlist update email");
    return { error: "Email not configured" };
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Result: ${marketTitle} — Viking Market`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 20px; font-weight: 700; color: #101820; margin: 0;">Viking Market</h1>
          </div>
          <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Market Result</p>
            <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #101820; line-height: 1.4;">${marketTitle}</h2>
            <div style="display: inline-block; background: ${resolution === "YES" ? "#22c55e" : "#ef4444"}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">
              ${resolution}
            </div>
          </div>
          <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 16px;">
            Hi${name ? ` ${name}` : ""},<br><br>
            A prediction market just resolved on Viking Market. Would you have predicted this correctly?
          </p>
          <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 24px;">
            Join Viking Market to trade on real-world events — politics, sports, crypto, and more. Start with 1,000 free points.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${baseUrl}/register" style="display: inline-block; background: #5adbb5; color: #101820; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600;">
              Start Trading Free
            </a>
          </div>
          <div style="text-align: center; margin: 8px 0 24px;">
            <a href="${marketUrl}" style="font-size: 13px; color: #6b7280; text-decoration: underline;">or view the market result</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
            You received this because you joined the Viking Market waitlist.
            <br />
            <a href="${baseUrl}/waitlist" style="color: #6b7280;">Unsubscribe</a>
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send waitlist update email:", error);
    return { error: "Failed to send email" };
  }
}

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
}) {
  const { to, name } = params;
  const baseUrl = process.env.NEXTAUTH_URL || "https://viking-market.com";

  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping welcome email");
    return { error: "Email not configured" };
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Welcome to Viking Market!",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 20px; font-weight: 700; color: #101820; margin: 0;">Viking Market</h1>
          </div>
          <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 16px;">
            Hi ${name},<br><br>
            Welcome to Viking Market — Norway's prediction market platform! You've been credited <strong>1,000 points</strong> to start trading.
          </p>
          <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 24px;">
            Here's how it works:
          </p>
          <ol style="font-size: 14px; color: #374151; line-height: 1.8; margin: 0 0 24px; padding-left: 20px;">
            <li><strong>Browse markets</strong> on events you know about</li>
            <li><strong>Buy YES or NO</strong> shares based on your prediction</li>
            <li><strong>Earn points</strong> when you're right — each winning share pays $1</li>
          </ol>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${baseUrl}/markets" style="display: inline-block; background: #5adbb5; color: #101820; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600;">
              Start Trading
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
            Viking Market — Predict the future, earn when you're right.
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return { error: "Failed to send email" };
  }
}
