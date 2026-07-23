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
    if (!stripe || !elements) return;

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: "http://localhost:5173",
      },
      redirect: "if_required",
    });

    console.log("RESULT:", result);

    if (result.error) {
      console.log(result.error);
    }

    if (result.paymentIntent) {
      console.log(result.paymentIntent.status);
    }
  };

  return (
    <form onSubmit={pay}>
      <PaymentElement />
      <button type="submit">Pay</button>
    </form>
  );
}

export default Checkout;