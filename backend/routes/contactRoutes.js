const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim();
    const message = String(req.body?.message || '').trim();

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ message: 'Please enter your name.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    if (message.length < 10 || message.length > 2000) {
      return res.status(400).json({ message: 'Please enter a message between 10 and 2000 characters.' });
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return res.status(503).json({
        message: 'Email service is not configured yet. Please use the email or WhatsApp link.',
      });
    }

    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.CONTACT_EMAIL || 'abdilahimohamed459@gmail.com',
      replyTo: email,
      subject: `CV Screening contact from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });

    return res.status(200).json({ message: 'Your message has been sent.' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
