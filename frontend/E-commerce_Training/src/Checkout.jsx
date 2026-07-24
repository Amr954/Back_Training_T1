import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

function Checkout() {
  const stripe = useStripe();
  const elements = useElements();

 const pay = async (e) => {
  e.preventDefault();

  console.log("PAY CLICKED");

  if (!stripe || !elements) {
    console.log("Stripe not ready");
    return;
  }

  const result = await stripe.confirmPayment({
    elements,
    confirmParams: {
        return_url: "http://localhost:5173",
      },
  });

  // console.log("RESULT:", result);

  if (result.error) {
    console.log(result.error);
    return;
  }

  // console.log("STATUS:", result.paymentIntent.status);
};

  return (
    <form onSubmit={pay}>
      <PaymentElement />
      <button type="submit">Pay</button>
    </form>
  );
}

export default Checkout;