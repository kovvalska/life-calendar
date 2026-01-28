const nodemailer = require('nodemailer');

function parseFrom(fromStr) {
  if (!fromStr || typeof fromStr !== 'string') return { name: 'Kalendarz Życia', email: '' };
  const m = fromStr.trim().match(/^(.+?)\s*<([^>]+)>$/);
  if (m) return { name: m[1].trim().replace(/^"|"$/g, ''), email: m[2].trim() };
  return { name: 'Kalendarz Życia', email: fromStr.trim() };
}

/**
 * SendGrid (API HTTPS) – darmowy plan, bez własnej domeny.
 * W SendGrid: Single Sender Verification – zweryfikuj np. swój Gmail. Potem: SENDGRID_API_KEY, SENDGRID_FROM (ten adres).
 */
async function sendViaSendGrid(to, subject, html) {
  const from = process.env.SENDGRID_FROM || process.env.EMAIL_FROM;
  if (!from) {
    throw new Error('SENDGRID_FROM lub EMAIL_FROM wymagane przy SENDGRID_API_KEY. Użyj zweryfikowanego nadawcy (np. Gmail) z SendGrid → Single Sender.');
  }
  const { name, email } = parseFrom(from);
  if (!email) throw new Error('SENDGRID_FROM musi zawierać adres email (np. "Kalendarz Życia <twoj@gmail.com>").');
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email, name },
      subject,
      content: [{ type: 'text/html', value: html }]
    })
  });
  if (res.ok) return { messageId: 'sendgrid' };
  const data = await res.json().catch(() => ({}));
  const msg = data.errors?.[0]?.message || data.message || `SendGrid ${res.status}`;
  throw new Error(msg);
}

/**
 * Brevo (API HTTPS) – 300 maili/dzień za darmo. Nadawca: zweryfikowany w Brevo (domena lub pojedynczy adres).
 * BREVO_API_KEY, BREVO_FROM (albo EMAIL_FROM).
 */
async function sendViaBrevo(to, subject, html) {
  const from = process.env.BREVO_FROM || process.env.EMAIL_FROM;
  if (!from) {
    throw new Error('BREVO_FROM lub EMAIL_FROM wymagane przy BREVO_API_KEY. Użyj zweryfikowanego nadawcy w Brevo.');
  }
  const { name, email } = parseFrom(from);
  if (!email) throw new Error('BREVO_FROM musi zawierać adres email.');
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name, email },
      to: [{ email: to }],
      subject,
      htmlContent: html
    })
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok) return { messageId: data.messageId };
  throw new Error(data.message || `Brevo API ${res.status}: ${JSON.stringify(data)}`);
}

/**
 * Resend (API HTTPS) – wymaga zweryfikowanej domeny. RESEND_API_KEY, RESEND_FROM.
 */
async function sendViaResend(to, subject, html) {
  const from = process.env.RESEND_FROM || process.env.EMAIL_FROM;
  if (!from) {
    throw new Error('RESEND_FROM lub EMAIL_FROM wymagane przy RESEND_API_KEY. Użyj adresu z domeny zweryfikowanej w Resend.');
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, to, subject, html })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Resend API ${res.status}: ${JSON.stringify(data)}`);
  }
  return { messageId: data.id };
}

const sendEmail = async (to, subject, html) => {
  // 1) SendGrid – darmowy, bez domeny: zweryfikuj Gmail w Single Sender
  if (process.env.SENDGRID_API_KEY) {
    return sendViaSendGrid(to, subject, html);
  }
  // 2) Brevo – 300/dzień za darmo, nadawca zweryfikowany w Brevo
  if (process.env.BREVO_API_KEY) {
    return sendViaBrevo(to, subject, html);
  }
  // 3) Resend – wymaga domeny
  if (process.env.RESEND_API_KEY) {
    return sendViaResend(to, subject, html);
  }
  // 4) SMTP – na Render free tier często: Connection timeout
  let transporter;
  if (process.env.EMAIL_HOST) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('EMAIL_USER i EMAIL_PASS są wymagane gdy EMAIL_HOST jest ustawione. Sprawdź zmienne w Render → Environment.');
    }
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      connectionTimeout: 30000,
      greetingTimeout: 20000
    });
  } else {
    // Development - Ethereal (testowy email)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Kalendarz Życia" <noreply@kalendarz-zycia.pl>',
    to,
    subject,
    html
  };

  const info = await transporter.sendMail(mailOptions);
  
  // W trybie development wyświetl link do podglądu
  if (!process.env.EMAIL_HOST) {
    console.log('📧 Email Preview URL:', nodemailer.getTestMessageUrl(info));
  }
  
  return info;
};

const sendVerificationEmail = async (email, code) => {
  const subject = 'Kod weryfikacyjny - Kalendarz Życia';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #fafafa; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px; border: 1px solid #e5e5e5; }
        h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 10px; }
        p { color: #6b6b6b; font-size: 16px; line-height: 1.6; }
        .code { font-size: 36px; font-weight: 700; color: #2a2a2a; letter-spacing: 8px; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 10px; margin: 30px 0; }
        .footer { font-size: 14px; color: #8a8a8a; margin-top: 30px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Witaj w Kalendarzu Życia!</h1>
        <p>Twój kod weryfikacyjny to:</p>
        <div class="code">${code}</div>
        <p>Kod jest ważny przez 15 minut.</p>
        <p>Jeśli nie rejestrowałeś/aś się w naszym serwisie, zignoruj tę wiadomość.</p>
        <div class="footer">
          Kalendarz Życia © 2026
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(email, subject, html);
};

module.exports = { sendEmail, sendVerificationEmail };
