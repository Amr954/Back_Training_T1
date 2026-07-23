const Stripe = require('stripe')

const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
console.log(process.env.STRIPE_SECRET_KEY.slice(0, 20));

module.exports = stripe