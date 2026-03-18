# RPScrape v2 - Full Stack Setup

This project consists of: A Python FastAPI backend and a Next.js frontend.

## Deployed URLs

- **Backend (Cloud Run):** https://racing-post-950990732577.europe-west2.run.app
- **Frontend (Cloudflare Pages):** _to be added_

## Prerequisites

- Python 3.11+
- Node.js 18+
- Git

## Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file with your Racing Post credentials:
   ```env
   EMAIL=your_email@example.com
   AUTH_STATE=your_auth_state
   ACCESS_TOKEN=your_access_token
   ```
5. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

## Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Deployment

You can also run the entire stack using Docker. A `Dockerfile` is provided in the `backend` directory.

To build and run the backend:
```bash
cd backend
docker build -t rpscrape-backend .
docker run -p 8000:3000 rpscrape-backend
```

## Features

- **High-performance scraping**: Uses `curl_cffi` for robust HTTP requests.
- **Real-time updates**: Track scraping progress via the dashboard.
- **Flexible configuration**: Customize fields and settings via TOML files.
- **Modern UI**: Clean, technical dashboard built with Next.js and Tailwind CSS..
