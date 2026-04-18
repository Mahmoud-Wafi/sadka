# Django Backend (AI Penetration)

## 1) Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
```

## 2) Run API Server

```bash
python manage.py runserver 0.0.0.0:5000
```

The frontend already points to:

`http://localhost:5000/api`

## 3) API Endpoints

- `GET /api/status`
- `POST /api/scan`
- `GET /api/scan/<task_id>`
- `DELETE /api/scan/<task_id>`
- `GET /api/history?limit=100`

## 4) Supported Tools

- `nmap`
- `owaspzap`
- `sqlmap`
- `metasploit`

`nikto` is intentionally replaced by `owaspzap`.

## 5) Optional OpenAI Report

If you want AI report generation from OpenAI, set environment variables before running:

```bash
export OPENAI_API_KEY="your_key_here"
export OPENAI_MODEL="gpt-4o-mini"
```

If no key is set, backend generates a fallback report automatically.
