import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, subject, html } = req.body as EmailRequest;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Create transporter with SMTP settings
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // Use TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection configuration
    await transporter.verify();

    // Send email
    const info = await transporter.sendMail({
      from: `"Satmar Montreal Matzos" <${process.env.EMAIL_FROM}>`,
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