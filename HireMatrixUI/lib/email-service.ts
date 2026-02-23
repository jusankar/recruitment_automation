import nodemailer, { Transporter } from "nodemailer";

type EmailProvider = "gmail" | "smtp";

interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

function getProvider(): EmailProvider {
  const provider = (process.env.EMAIL_PROVIDER || "gmail").toLowerCase();
  return provider === "smtp" ? "smtp" : "gmail";
}

function createTransporter(): Transporter {
  const provider = getProvider();

  if (provider === "gmail") {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD are required for EMAIL_PROVIDER=gmail");
    }

    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";

  if (!host || !user || !pass) {
    throw new Error("SMTP_HOST, SMTP_USER, and SMTP_PASS are required for EMAIL_PROVIDER=smtp");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

function getFromAddress(): string {
  const configured = process.env.EMAIL_FROM;
  if (configured) return configured;
  return process.env.GMAIL_USER || process.env.SMTP_USER || "no-reply@hirematrix.local";
}

export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: getFromAddress(),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}
