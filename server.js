const path = require("path");
const express = require("express");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP_HOST, SMTP_USER, SMTP_PASS must be configured");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: { user, pass },
  });
}

app.post("/api/contact", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim();
  const org = String(req.body.org || "").trim();
  const subject = String(req.body.subject || "").trim();
  const message = String(req.body.body || req.body.message || "").trim();

  if (!name || !email || !message) {
    return res.status(400).json({ error: "name, email and message are required" });
  }

  const to = process.env.MAIL_TO;
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const cc = process.env.MAIL_CC || undefined;

  if (!to) {
    return res.status(500).json({ error: "MAIL_TO is not configured" });
  }

  const now = new Date().toISOString();
  const rows = [
    ["Submitted At (UTC)", now],
    ["Name", name],
    ["Email", email],
    ["Organization", org || "-"],
    ["Topic", subject || "-"],
    ["Message", message],
    ["Source Page", req.get("origin") || req.get("referer") || "-"],
  ];

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><th style=\"text-align:left;padding:8px;border:1px solid #ddd;background:#f7f7f7;\">${escapeHtml(label)}</th><td style=\"padding:8px;border:1px solid #ddd;white-space:pre-wrap;\">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111;">
      <h2 style="margin:0 0 12px;">New Contact Form Submission</h2>
      <table style="border-collapse:collapse;width:100%;max-width:760px;">${tableRows}</table>
    </div>
  `;

  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from,
      to,
      cc,
      replyTo: email,
      subject: `[PressGenAI] Contact: ${subject || "General Inquiry"}`,
      html,
      text,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Contact form send failed:", error.message);
    return res.status(500).json({ error: "Failed to send email" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
