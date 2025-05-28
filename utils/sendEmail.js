import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendEmail = async (to, subject, verificationLink) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2>${subject}</h2>
          <p>Thank you for registering on SocioFeed.</p>
          <p>Please verify your email by clicking the button below:</p>
          <a href="${verificationLink}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: #fff; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
          <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
          <p>${verificationLink}</p>
          <br />
          <p>— SocioFeed Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

export const sendResetPasswordEmail = async (to, subject, token) => {
  const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Click the button below to proceed:</p>
          <a href="${resetLink}" target="_blank" style="display:inline-block; padding:10px 20px; background-color:#e53935; color:#fff; text-decoration:none; border-radius:5px;">
            Reset Password
          </a>
          <p>If the button doesn't work, copy and paste the following link in your browser:</p>
          <p>${resetLink}</p>
          <br />
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>— SocioFeed Team</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Reset password email failed:', error);
    return false;
  }
};
