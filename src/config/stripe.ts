import Stripe from "stripe";

const stripeSecretKey = process.env["STRIPE_SECRET_KEY"];
const stripeWebhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

if (!stripeWebhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET environment variable is required");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2022-11-15",
});

export { stripeWebhookSecret };
export default stripe;
