import React from 'react';

const CheckoutButton = () => {
  const handleCheckout = async () => {
    const response = await fetch('http://localhost:5000/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          { name: 'Hackathon Entry', price: 4999, quantity: 1 }
        ]
      })
    });

    const data = await response.json();
    window.location.href = data.url;
  };

  return (
    <button
      onClick={handleCheckout}
      style={{ padding: '12px 24px', fontSize: '18px', backgroundColor: '#6772e5', color: '#fff', border: 'none', borderRadius: '5px' }}
    >
      Pay with Stripe
    </button>
  );
};

export default CheckoutButton;
