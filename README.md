# ArogyaVani

ArogyaVani (Voice of Health) is an AI-powered medical text simplification tool designed to bridge the gap between complex medical jargon and patient understanding. It transforms diagnosis reports and consent forms into plain, 5th-grade level language using a hybrid approach (Local Rule-Based + LLM).

## Features

- **Simplify Medical Text:** Instantly converts medical terms (e.g., "Myocardial Infarction") to plain English ("Heart Attack").
- **Hybrid AI Engine:** Uses a robust local dictionary for privacy and speed, with optional OpenAI GPT-4o-mini integration for advanced summarization.
- **OCR Support:** Client-side optical character recognition (Tesseract.js) to read text from images and PDFs.
- **Text-to-Speech:** Listen to the simplified explanation for better accessibility.
- **Comprehension Quiz:** Auto-generated YES/NO questions to verify patient understanding.
- **Audit Log:** Tracks usage for quality assurance (Admin only).

## Project Structure

```
arogyavani-replit-demo/
├─ backend/
│  ├─ server.js        # Express server & API routes
│  ├─ simplify.js      # Simplification logic (Local + OpenAI)
│  ├─ package.json     # Backend dependencies
│  ├─ tests/           # Unit tests
├─ frontend/
│  ├─ index.html       # Main UI
│  ├─ styles.css       # Styles (Plus Jakarta Sans, Animations)
│  ├─ script.js        # Frontend logic (OCR, API, TTS)
├─ .start.sh           # Replit configuration
└─ deploy.md           # Deployment instructions
```

## Setup & Running Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/arogyavani-replit-demo.git
    cd arogyavani-replit-demo
    ```

2.  **Install Dependencies:**
    ```bash
    cd backend
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the `backend/` directory (optional):
    ```env
    OPENAI_API_KEY=sk-... (Optional: for advanced simplification)
    ADMIN_TOKEN=mysecrettoken (Optional: for accessing audit logs)
    PORT=3000
    ```

4.  **Run the Server:**
    ```bash
    npm start
    ```
    The app will be available at `http://localhost:3000`.

## Testing

Run the local simplification logic tests:
```bash
cd backend
npm test
```

## API Endpoints

- `POST /api/simplify`: Accepts `{ text }`, returns simplified version.
- `POST /api/quiz`: Accepts `{ simplified }`, returns quiz questions.
- `GET /api/stats`: Returns usage statistics.
- `GET /api/audit`: Returns audit logs (Requires `x-admin-token` header).

## Deployment

See [deploy.md](deploy.md) for instructions on how to deploy to Replit, Render, or Vercel.

## License

MIT
