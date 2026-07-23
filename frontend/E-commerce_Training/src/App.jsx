import { useState } from "react";
import axios from "axios";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Checkout from "./Checkout";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
console.log(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
function App() {
  const [clientSecret, setClientSecret] = useState("");

  const createOrder = async () => {
   try {
     const res = await axios.post(
      "http://localhost:5000/api/orders",
      {
        paymentMethod: "stripe",
        shippingAddress: {
          fullName: "Amr",
          phone: "0120000030",
          country: "Egypt",
          city: "Giza",
          address: "Street 1",
          postalCode: "62511",
        },
      },
      {
        headers: {
          Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNGI1YTVmYmY1ZGZjMTY3NjQ1NWE1MSIsImlhdCI6MTc4NDgyNjMyMCwiZXhwIjoxNzg0ODI4MTIwfQ.j9sx5UWNCXJPb4-eZkUVSn_98dbWyhlHndMGVZdh8L8"
          ,
        },
      }
    );
    setClientSecret(res.data.data.clientSecret);
    console.log("CLIENT SECRET:", res.data.data.clientSecret);
   } catch (error) {
    console.log(error.response?.data);
   }

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