# Full-Stack React + Express + MongoDB Boilerplate

## Project Structure

```
root/
├── frontend/   # React app
├── backend/    # Express API server
```

## Prerequisites
- Node.js (v16+ recommended)
- npm
- MongoDB Atlas or local MongoDB instance

## Setup

### 1. Clone the repository
```bash
git clone https://github.com/Adarsh2345/Action_Hub_practice.git
cd <project-root>
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env # or create .env manually
npm install
npm start
```

- Edit `.env` and set your `MONGO_URI`.
- The backend runs on [http://localhost:5000](http://localhost:5000)

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```
- The frontend runs on [http://localhost:3000](http://localhost:3000)
- Proxy is set up for API calls to backend.

## Scripts
- `npm start` — Start dev server
- `npm run build` — Production build (frontend)

## Features
- React 18 frontend with Axios
- Express backend with MongoDB (Mongoose)
- Environment variable support with dotenv
- CORS enabled
- Ready for deployment and collaboration

## Contributing
- Fork, branch, and submit PRs.
- Use clear commit messages.


