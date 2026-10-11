const nodemailer = require('nodemailer')

nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: 'amrrreda2006@gmail.com', pass: 'tkvfadglzxsxzrhv' }
}).verify()
  .then(() => console.log('OK'))
  .catch(e => console.log('FAILED:', e.message))