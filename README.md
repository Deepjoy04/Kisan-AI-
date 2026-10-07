# KisanAI

KisanAI is a full-stack agriculture assistant built with FastAPI, React, TensorFlow, and Gemini.

It provides:
- Crop disease analysis from leaf images
- Soil health recommendations from NPK/pH/moisture inputs
- Multilingual farming chatbot (English, Hindi, Telugu, Tamil)
- Weather forecast and crop guidance
- Market price tracking for commodities
- User authentication and activity history

## Tech Stack

### Backend
- FastAPI
- TensorFlow / Keras
- Google Gemini API
- SQLite (built-in local database)
- SlowAPI (rate limiting)
- JWT auth with bcrypt hashing

### Frontend
- React + Vite
- Tailwind CSS
- Framer Motion
- Axios
- Recharts

## Project Structure

```text
kisanAI/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── models/
│   │   └── plant_disease_model_v2.keras
│   ├── routes/
│   │   ├── auth.py
│   │   ├── chat.py
│   │   ├── disease.py
│   │   ├── market.py
│   │   ├── soil.py
│   │   └── weather.py
│   ├── services/
│   │   ├── gemini_service.py
│   │   └── model_service.py
│   └── utils/
│       ├── database.py
│       ├── limiter.py
│       └── security.py
└── frontend/
    ├── package.json
    ├── index.html
    └── src/
        ├── App.jsx
        ├── config/api.js
        ├── context/
        ├── components/
        └── pages/
```

## Prerequisites

- Python 3.10+ (recommended 3.10/3.11 for TensorFlow compatibility)
- Node.js 18+
- API keys (optional / as needed):
  - Google Gemini API key
  - OpenWeather API key
  - Data.gov.in API key

## Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Fill backend `.env`:

```env
GEMINI_API_KEY=...
OPENWEATHER_API_KEY=...
DATA_GOV_IN_API_KEY=...
JWT_SECRET=...
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

Run backend:

```bash
uvicorn main:app --reload
```


Backend URL: `http://localhost:8000`

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Default frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Run frontend:

```bash
npm run dev
```

Frontend URL: `http://localhost:5173`

## Main API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `GET /api/auth/history` (Bearer token)

### Disease
- `POST /api/disease/analyze` (multipart file upload, optional `crop`)

### Soil
- `POST /api/soil/analyze`

### Chat
- `POST /api/chat/message`

### Weather
- `GET /api/weather/current?lat=...&lon=...`
- `GET /api/weather/forecast?lat=...&lon=...`

### Market
- `GET /api/market/prices?commodity=Tomato`

## Security and Reliability Notes

- JWT secret is mandatory (no insecure fallback).
- Auth routes have validation and rate limiting.
- Global error middleware returns safe generic 500 responses.
- TensorFlow `model.predict()` is executed off the event loop.
- Gemini responses use in-memory TTL caching.
- Market responses use in-memory TTL caching and deterministic derived trend output.

## Known Functional Limits

- Current disease model is PlantVillage-based and does not support Rice/Wheat classification directly.
- Market trend is derived from current mandi snapshot and is not official historical time-series.
- In-memory caches reset when backend restarts.

## Frontend Routing

Includes a wildcard route (`*`) with a Not Found page to avoid blank screen on unknown URLs.

## Troubleshooting

### Backend fails to start
- Check all required env vars in `backend/.env`
- Confirm model file exists at `backend/models/plant_disease_model_v2.keras`
- Reinstall dependencies in a clean virtual environment

### Gemini quota errors (429)
- Verify all 3 Gemini keys are valid
- Wait for quota reset or reduce request rate
- Increase cache TTL to reduce repeated calls

### CORS errors
- Add your frontend origin to `CORS_ORIGINS` in backend `.env`

### Frontend cannot reach API
- Ensure `VITE_API_BASE_URL` points to the running backend
- Confirm backend is reachable at `http://localhost:8000`

## Production Deployment with Docker Compose

You can launch the entire stack (FastAPI Backend + React Frontend + Redis Cache) in one command:

```bash
docker compose up --build
```

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:8000`
- **Redis Service:** `redis:6379`
- **Health Check Endpoint:** `http://localhost:8000/api/health`

## Running Automated Tests

Run the backend test suite:

```bash
cd backend
python -m unittest tests/test_api.py
```
