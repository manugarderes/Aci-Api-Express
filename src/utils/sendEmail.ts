import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) throw new Error("Missing SENDGRID_API_KEY");

sgMail.setApiKey(apiKey);

export default sgMail;

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const fromName = process.env.SENDGRID_FROM_NAME || "";

  if (!fromEmail) throw new Error("Missing SENDGRID_FROM_EMAIL");

  await sgMail.send({
    to: args.to,
    from: { email: fromEmail, name: fromName || undefined },
    subject: args.subject,
    text: args.text,
    html: args.html,
  });
}
