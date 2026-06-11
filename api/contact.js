import nodemailer from 'nodemailer';

const requiredFields = ['full_name', 'email', 'location', 'occupation'];

const readBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return Object.fromEntries(new URLSearchParams(req.body));

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Object.fromEntries(new URLSearchParams(Buffer.concat(chunks).toString('utf8')));
};

const redirect = (res, location) => {
  res.writeHead(303, { Location: location });
  res.end();
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = await readBody(req);

  const missingField = requiredFields.find((field) => !String(form[field] || '').trim());
  if (missingField) return redirect(res, '/contact?error=required');

  const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpSecure = String(process.env.SMTP_SECURE || 'true') === 'true';
  const smtpUser = process.env.SMTP_USER || 'admin@matchmakingbureau.com';
  const smtpPass = process.env.SMTP_PASS;
  const contactTo = process.env.CONTACT_TO || 'admin@matchmakingbureau.com';

  if (!smtpPass) {
    console.error('SMTP_PASS is not configured.');
    return redirect(res, '/contact?error=email-config');
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const lines = [
    `Full name: ${form.full_name}`,
    `Email: ${form.email}`,
    `Location: ${form.location}`,
    `Occupation: ${form.occupation}`,
    '',
    'Relationship intentions:',
    form.intentions || 'Not provided',
    '',
    `Discretion agreement: ${form.discretion_agreement || 'Not accepted'}`,
  ];

  try {
    await transporter.sendMail({
      from: `"The Matchmaking Bureau" <${smtpUser}>`,
      to: contactTo,
      replyTo: form.email,
      subject: 'New Matchmaking Bureau International application',
      text: lines.join('\n'),
    });

    return redirect(res, '/contact?sent=1');
  } catch (error) {
    console.error('Contact form email failed:', error);
    return redirect(res, '/contact?error=email-send');
  }
}
