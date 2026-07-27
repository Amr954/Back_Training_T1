import { useState } from "react";
import axios from "axios";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Checkout from "./Checkout";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
function App() {
  const [clientSecret, setClientSecret] = useState("");

const createOrder = async () => {
    const res = await axios.post(
      "https://back-training-t1.vercel.app/api/orders",
      {
        paymentMethod: "stripe",
        shippingAddress: {
          fullName: "Amr Reda",
          phone: "01000000000",
          country: "Egypt",
          city: "Cairo",
          address: "Nasr City",
          postalCode: "11765",
        },
      },
      {
        headers: {
          Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNGI1YTVmYmY1ZGZjMTY3NjQ1NWE1MSIsImlhdCI6MTc4NTEyNDM2NCwiZXhwIjoxNzg1MTI2MTY0fQ.SImHVqpCV2TPZf4_zplNDGIPYMf0apVBeJqkTz6rWNE",
        },
      }
    );

    setClientSecret(res.data.data.clientSecret);
  };

  return (
    <>
      {!clientSecret ? (
        <button onClick={createOrder}>Create Order</button>
      ) : (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret }}
        >
          <Checkout />
        </Elements>
      )}
    </>
  );
}

export default App;