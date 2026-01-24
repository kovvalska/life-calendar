const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
  // Konfiguracja transportera
  // Dla developmentu używamy Ethereal (fake SMTP)
  // W produkcji zamień na prawdziwy serwis (Gmail, SendGrid, etc.)
  
  let transporter;
  
  if (process.env.EMAIL_HOST) {
    // Produkcja - prawdziwy serwis email
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
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
