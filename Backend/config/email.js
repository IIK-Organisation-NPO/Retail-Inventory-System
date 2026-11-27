const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"SpazaNet" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your SpazaNet Account',
    html: `
      <h2>Welcome to SpazaNet!</h2>
      <p>Your 6-digit verification code is: <strong style="font-size: 24px;">${otp}</strong></p>
      <p>This code will expire in 15 minutes.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Real email sent to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
    // CRITICAL FIX: Throw the error so the controller knows it failed
    throw new Error("Failed to send OTP email. Check backend server logs.");
  }
};

module.exports = sendOTPEmail;