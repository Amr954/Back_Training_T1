const nodemailer = require('nodemailer')

// 1) LOG ENV VALUES: right after the require, at the top level
console.log('EMAIL_HOST:', JSON.stringify(process.env.EMAIL_HOST))
console.log('EMAIL_PORT:', JSON.stringify(process.env.EMAIL_PORT))
console.log('EMAIL_USER:', JSON.stringify(process.env.EMAIL_USER))
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS?.length)

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false, // true only if using port 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

// 2) VERIFY: right after createTransport, before sendEmail
transporter.verify()
    .then(() => console.log('Email ready'))
    .catch(err => console.error('Email config error:', err.message))

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