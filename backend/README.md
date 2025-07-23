# Backend (Express)

## Available Scripts

- `npm start` — Starts the server
- `npm run dev` — Starts the server with nodemon (if installed)

## Project Info
- Express.js
- Mongoose (MongoDB)
- dotenv for environment variables
- CORS enabled 

## Stripe Setup

1. Create a `.env` file in the `backend/` directory if it doesn't exist.
2. Add your Stripe secret key:

```
STRIPE_SECRET_KEY=sk_test_...
```

Replace `sk_test_...` with your actual Stripe secret key (test or live). 