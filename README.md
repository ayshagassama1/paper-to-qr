# Paper to QR

A restaurant manager photographs their paper or chalkboard menu and gets an editable digital menu, a code to come back with, and a printable QR code for the tables. No typing, no account.

Live: https://d1gdupqowt3o8k.cloudfront.net

## How it works

- **Frontend:** React + Vite + TypeScript, shadcn/ui restyled with the project theme (`frontend/src/styles/theme.css`). Photos are shrunk to 1600 px in the browser before upload, which also strips EXIF metadata. The QR code is drawn in the browser from the menu's address and never stored.
- **API:** FastAPI on AWS Lambda (Mangum). One Claude Haiku 5.5 call per menu turns the photos into a list of dishes with prices, using structured outputs.
- **Data:** one MongoDB Atlas collection, `restaurants` (name, slug, code, dishes). Photos are never stored.
- **Hosting:** one CloudFront distribution serves the app from a private S3 bucket and routes `/api/*` to the Lambda through an HTTP API.

## Run it locally

Requirements: Node 20+, Python 3.12, a MongoDB Atlas cluster (M0 is fine), an Anthropic API key.

```bash
cp backend/.env.example backend/.env   # then fill in ANTHROPIC_API_KEY, MONGODB_URI, MONGODB_DB=paper_to_qr

cd backend
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt -r requirements-dev.txt
.venv/bin/uvicorn app.main:app --reload --port 8000

# in another terminal
cd frontend
npm install
npm run dev -- --host
```

Open http://localhost:5173. To scan the QR code with a phone on the same Wi-Fi, open the site from the Network address Vite prints: the QR code points to the address the page was opened from.

Tests: `cd backend && .venv/bin/python -m pytest`

## Deploy to AWS

Requires the AWS SAM CLI and AWS credentials. Atlas network access must allow `0.0.0.0/0`, since a Lambda outside a VPC has no fixed IP.

```bash
sam build
sam deploy --stack-name paper-to-qr --resolve-s3 --capabilities CAPABILITY_IAM \
  --parameter-overrides AnthropicApiKey=... MongoDbUri=... MongoDbName=paper_to_qr

cd frontend && npm run build
aws s3 sync dist s3://<FrontendBucketName> --delete
aws cloudfront create-invalidation --distribution-id <DistributionId> --paths "/*"
```

`FrontendBucketName`, `DistributionId` and `SiteUrl` are stack outputs. Cost stays near zero for a demo: pay-as-you-go CloudFront on the cheapest price class, an arm64 Lambda, and 7-day log retention.
