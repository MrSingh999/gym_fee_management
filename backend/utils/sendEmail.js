import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const isSmtpConfigured = 
    process.env.SMTP_HOST && 
    process.env.SMTP_PORT && 
    process.env.SMTP_USER && 
    process.env.SMTP_PASS;

  const isResendConfigured = !!process.env.RESEND_API_KEY;

  if (!isResendConfigured && !isSmtpConfigured) {
    console.log('\n=================== MOCK EMAIL SERVICE ===================');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log('-------------------- Message Body --------------------');
    console.log(options.message);
    console.log('==========================================================\n');
    return { success: true, mock: true };
  }

  let transporter;

  if (isResendConfigured) {
    // Configure nodemailer with Resend SMTP relay
    transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true, // true for port 465
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    });
  } else {
    // Configure nodemailer with custom SMTP transporter
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Define email parameters
  const message = {
    from: `${process.env.FROM_NAME || "HEAVEN'S ARENA"} <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<p>${options.message}</p>`,
  };

  // Send email
  const info = await transporter.sendMail(message);
  console.log(`Email dispatched successfully: ${info.messageId}`);
  return { success: true, messageId: info.messageId };
};

export default sendEmail;
