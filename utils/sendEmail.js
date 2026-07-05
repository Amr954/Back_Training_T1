const nodemailer = require('nodemailer')

// Requires these vars in your .env:
// EMAIL_HOST=smtp.gmail.com
// EMAIL_PORT=587
// EMAIL_USER=your_email@gmail.com
// EMAIL_PASS=your_app_password   <-- use a Gmail "App Password", not your normal password
console.log({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
});
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