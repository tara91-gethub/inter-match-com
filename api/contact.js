import nodemailer from 'nodemailer';

const requiredFields = ['full_name', 'email'];
const allowedHosts = new Set(['matchmakingbureau.com', 'www.matchmakingbureau.com', 'localhost', '127.0.0.1']);

const parseMultipartBody = (body, contentType) => {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = boundaryMatch?.[1] || boundaryMatch?.[2];
  if (!boundary) return {};

  return body.split(`--${boundary}`).reduce((fields, part) => {
    const nameMatch = part.match(/name="([^"]+)"/);
    if (!nameMatch) return fields;

    const [, name] = nameMatch;
    const valueStart = part.indexOf('\r\n\r\n');
    if (valueStart === -1) return fields;

    fields[name] = part
      .slice(valueStart + 4)
      .replace(/\r\n$/, '')
      .trim();
    return fields;
  }, {});
};

const readBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return Object.fromEntries(new URLSearchParams(req.body));

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString('utf8');
  const contentType = req.headers['content-type'] || '';

  if (contentType.includes('multipart/form-data')) {
    return parseMultipartBody(body, contentType);
  }

  return Object.fromEntries(new URLSearchParams(body));
};

const redirect = (res, location) => {
  res.writeHead(303, { Location: location });
  res.end();
};

const sendResult = (req, res, statusCode, payload, location) => {
  const accept = req.headers.accept || '';
  if (accept.includes('application/json')) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
    return;
  }

  redirect(res, location);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = req.headers.origin;
  if (origin) {
    try {
      const host = new URL(origin).hostname;
      if (!allowedHosts.has(host) && !host.endsWith('.vercel.app')) {
        return sendResult(req, res, 403, { ok: false, error: 'invalid-origin' }, '/contact?error=invalid-origin');
      }
    } catch {
      return sendResult(req, res, 403, { ok: false, error: 'invalid-origin' }, '/contact?error=invalid-origin');
    }
  }

  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength > 50_000) {
    return sendResult(req, res, 413, { ok: false, error: 'submission-too-large' }, '/contact?error=too-large');
  }

  const form = await readBody(req);

  if (String(form.website || '').trim()) {
    return sendResult(req, res, 200, { ok: true, redirect: '/thank-you' }, '/thank-you');
  }

  const missingField = requiredFields.find((field) => !String(form[field] || '').trim());
  if (missingField) {
    console.warn('Contact form missing required field', {
      missingField,
      receivedFields: Object.keys(form),
    });
    return sendResult(req, res, 400, { ok: false, error: 'required', field: missingField }, '/contact?error=required');
  }

  if (!/^\S+@\S+\.\S+$/.test(String(form.email).trim())) {
    return sendResult(req, res, 400, { ok: false, error: 'invalid-email' }, '/contact?error=invalid-email');
  }

  const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpSecure = String(process.env.SMTP_SECURE || 'true') === 'true';
  const smtpUser = process.env.SMTP_USER || 'admin@matchmakingbureau.com';
  const smtpPass = process.env.SMTP_PASS;
  const contactTo = process.env.CONTACT_TO || 'admin@matchmakingbureau.com';

  if (!smtpPass) {
    console.error('SMTP_PASS is not configured.');
    return sendResult(req, res, 500, { ok: false, error: 'email-config' }, '/contact?error=email-config');
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const lines = [
    `Full name: ${form.full_name}`,
    `Email: ${form.email}`,
    `Location: ${form.location || 'Not provided'}`,
    `Occupation: ${form.occupation || 'Not provided'}`,
    '',
    'Relationship intentions:',
    form.intentions || 'Not provided',
    '',
    `Discretion agreement: ${form.discretion_agreement || 'Not accepted'}`,
  ];

  try {
    const info = await transporter.sendMail({
      from: `"The Matchmaking Bureau" <${smtpUser}>`,
      to: contactTo,
      replyTo: form.email,
      subject: 'New Matchmaking Bureau International application',
      text: lines.join('\n'),
    });

    console.log('Contact form email accepted', { messageId: info.messageId, to: contactTo });
    return sendResult(req, res, 200, { ok: true, redirect: '/thank-you' }, '/thank-you');
  } catch (error) {
    console.error('Contact form email failed:', error);
    return sendResult(req, res, 500, { ok: false, error: 'email-send' }, '/contact?error=email-send');
  }
}
