import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  usebilling?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, subject, html, usebilling } = req.body as EmailRequest;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Choose SMTP configuration based on email type
    const smtpConfig = usebilling
      ? {
          host: process.env.SMTP_HOST_BILLING,
          port: parseInt(process.env.SMTP_PORT_BILLING || "587"),
          user: process.env.SMTP_USER_BILLING,
          pass: process.env.SMTP_PASS_BILLING,
          from: process.env.EMAIL_FROM_BILLING,
        }
      : {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587"),
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
          from: process.env.EMAIL_FROM,
        };

    // Create transporter with selected SMTP settings
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: false, // Use TLS
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    // Verify connection configuration
    await transporter.verify();

    // Send email
    const info = await transporter.sendMail({
      from: smtpConfig.from,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Email sending failed:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    });
  }
}