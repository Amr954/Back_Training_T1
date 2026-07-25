const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false, // true only if using port 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

/**
 * sendEmail({ to, subject, text, html, from })
 * `from` is optional per-call override. Otherwise falls back to
 * EMAIL_FROM_NAME in .env, or just the raw EMAIL_USER address.
 */
const sendEmail = async ({ to, subject, text, html, from }) => {
    const senderName = process.env.EMAIL_FROM_NAME
    const defaultFrom = senderName
        ? `"${senderName}" <${process.env.EMAIL_USER}>`
        : process.env.EMAIL_USER

    await transporter.sendMail({
        from: from || defaultFrom,
        to,
        subject,
        text,
        html
    })
}

module.exports = sendEmail