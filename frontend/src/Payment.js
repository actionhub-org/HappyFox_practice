import React, { useState } from 'react';

const Payment = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('http://localhost:5000/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.url) {
      window.location.href = data.url; // Redirect to Stripe Checkout
    } else {
      alert(data.error || 'Failed to create checkout session');
    }
  };

  return (
    <form onSubmit={handlePay} style={{ maxWidth: 400, margin: '0 auto', padding: 32 }}>
      <h2>Pay with Stripe</h2>
      <input
        type="number"
        min="1"
        step="0.01"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        required
        placeholder="Amount (USD)"
        style={{ width: '100%', padding: 12, marginBottom: 16, fontSize: 18 }}
      />
      <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, fontSize: 18 }}>
        {loading ? 'Redirecting...' : 'Pay'}
      </button>
    </form>
  );
};

export default Payment; 