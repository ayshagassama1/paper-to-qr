---
doc: spec
status: approved
---

# Paper to QR: Technical Spec

## How This Works, In Plain Language

Paper to QR has four pieces:

- **The website (React).** Everything the manager and the customer see. It runs in the browser. Before sending photos, it shrinks them, which also removes their metadata. It also draws the QR code itself from the restaurant's address, so the QR code is never stored anywhere.
- **The API (FastAPI on AWS Lambda).** A small Python program that wakes up when the website asks for something. It creates restaurants, finds a menu from a code, and saves dish changes.
- **Claude Haiku 5.5.** The API sends it the menu photos and gets back a ready-made list of dishes with prices in a fixed JSON shape. It's the cheapest Claude model, at well under one cent per menu.
- **MongoDB Atlas.** One collection, `restaurants`. Each document holds a restaurant's name, its slug (the `chez-marcel` in `/chez-marcel`), its code and its dishes.

**A concrete walk-through.** The manager of Chez Marcel photographs the chalkboard. The browser shrinks the photo to about 1600 px and sends it with the name to the API. The API passes the photo to Claude, gets back `[{name: "Quiche lorraine", price: 9.50}, ...]`, saves Chez Marcel with a new code and the slug `chez-marcel`, and sends everything back. The browser shows the list, the code and a QR code pointing to `https://<site>/chez-marcel`. The next day, the manager types the code. The API finds the document with that code and returns it, and every pencil, x or toggle click updates that same document. A customer who scans the QR code lands on `/chez-marcel`. The website asks the API for that slug and shows the active dishes.

**Why this shape.** It is the stack the learner already uses, with nothing extra. One API function, one collection, one model call per menu. The QR code and the photos never touch storage. One CloudFront address serves both the website and the API.

## The Core Journey Through the System

PRD ref: `prd.md > The Core Journey`.

1. **Manager opens the site.** CloudFront serves the React app from S3. `HomePage` shows the Navbar, the Hero and the tabs, with **Existing menu** open.
2. **New restaurant: name + photos.** `NewRestaurantForm` compresses each photo in the browser (`compressImage.ts`: max 1600 px long edge, JPEG, metadata stripped), then sends `POST /api/restaurants` as multipart (name + up to 5 images).
3. **Steps shown.** While the upload runs, `ProcessingSteps` shows "Uploading photos…" (real upload progress from the browser). Once the upload completes and the app waits for the response, it shows "Reading your menu…".
4. **The API extracts and saves.** `extraction.py` sends all the images in one Claude Haiku 5.5 request with a Pydantic output schema. `codes.py` generates the code and a unique slug. The document is inserted in `restaurants`, and the API responds with the private view (name, slug, code, dishes, `extraction_empty`).
5. **Menu screen.** `MenuEditor` shows the name, `DishRow` lines, `QrPanel` and the code. If `extraction_empty` is true, it shows the "better photo or add by hand" message above an empty list.
6. **Edits.** Each validated edit, add, delete (after `AlertDialog` confirmation) or toggle calls `/api/manage/dishes...` with the code in the `X-Menu-Code` header. The API updates the document and returns the dish, and the UI updates that line.
7. **QR download.** `QrPanel` renders the QR for `window.location.origin + "/" + slug` and downloads it as a PNG.
8. **Customer scans.** CloudFront serves the React app for `/chez-marcel`. `CustomerMenuPage` calls `GET /api/menus/chez-marcel` and shows the name and the active dishes.
9. **Manager returns.** `ExistingMenuForm` calls `GET /api/manage` with the code header. On 404 it shows "Restaurant not found" on the form; on 200 it shows the same `MenuEditor`.

## Stack

All choices below were made by the learner, unless they are marked as derived.

| Piece | Choice | Docs |
|---|---|---|
| Frontend | React + Vite + TypeScript *(TypeScript is an agent default, see Decisions)* | https://react.dev, https://vite.dev |
| Routing | React Router (`/` and `/:slug`) | https://reactrouter.com |
| UI primitives | shadcn/ui (Tabs, AlertDialog, Switch, Button, Input) on Tailwind CSS, **restyled with the project theme** | https://ui.shadcn.com, https://tailwindcss.com |
| Icons | lucide-react (pencil, x, check, download), shadcn's default icon set | https://lucide.dev |
| Fonts | Fraunces + DM Sans, self-hosted through `@fontsource-variable/fraunces` and `@fontsource-variable/dm-sans` | https://fontsource.org |
| QR code | `qrcode.react` (`QRCodeCanvas`, exported to PNG) | https://github.com/zpao/qrcode.react |
| Backend | Python 3.12, FastAPI, Mangum (Lambda adapter), python-multipart | https://fastapi.tiangolo.com, https://mangum.fastapiexpert.com |
| Extraction | Anthropic Python SDK, model `claude-haiku-5-5` | https://platform.claude.com/docs/en/build-with-claude/vision |
| Database | MongoDB Atlas (free M0 cluster), PyMongo (sync) | https://www.mongodb.com/docs/languages/python/pymongo-driver/current/ |
| Infra | AWS SAM: Lambda + HTTP API + S3 + CloudFront | https://docs.aws.amazon.com/serverless-application-model/ |
| Backend tests | pytest, mongomock, FastAPI TestClient | https://docs.pytest.org |

**Rationale:**
- React, FastAPI, Atlas and AWS are the learner's usual stack.
- shadcn is kept for behavior; the default look is replaced (see Look and Feel).
- Claude Haiku 5.5 was the learner's choice: "the cheapest model possible".
- **Unverified, check at the start of the build:** Haiku 5.5's maximum image resolution, current package versions, and HTTP API / Lambda payload and timeout limits.

## Where It Runs and How Someone Tries It

### Local development
- Requirements: Node 20+, Python 3.12, an Atlas cluster (M0 is fine), an Anthropic API key.
- `backend/.env` (copied from `.env.example`, never committed): `MONGODB_URI`, `MONGODB_DB=paper_to_qr`, `ANTHROPIC_API_KEY`.
- Backend: `cd backend && pip install -r requirements.txt -r requirements-dev.txt && uvicorn app.main:app --reload --port 8000`
- Frontend: `cd frontend && npm install && npm run dev -- --host`. Vite proxies `/api` to `localhost:8000`.
- Open `http://localhost:5173`. To scan with a phone on the same Wi-Fi, open the site through the LAN address Vite prints. The QR code is built from `window.location.origin`, so it points to that LAN address.

### Deployment (chosen by the learner, so the judges can open the site)
- `sam build && sam deploy --guided` (first time). It creates the Lambda, the HTTP API, the S3 bucket and the CloudFront distribution. `AnthropicApiKey` and `MongoDbUri` are `NoEcho` parameters.
- `cd frontend && npm run build && aws s3 sync dist s3://<FrontendBucket> --delete`, then `aws cloudfront create-invalidation --distribution-id <id> --paths "/*"`.
- Atlas network access: `0.0.0.0/0`, because a Lambda outside a VPC has no fixed IP. This is acceptable for a PoC with throwaway data.

### For the submission
- **Demo video:** on the deployed site, photograph or upload a real menu, show the steps and the list, fix a line, toggle a dish, download the QR code, scan it with a phone, then come back with the code.
- **Public GitHub repository:** handled in `6-ship`.

## Look and Feel

From `prd.md > Look and Feel`. No new design discovery.

### Theme first
Before any screen exists, `frontend/src/styles/theme.css` defines the tokens shadcn reads (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--radius`, fonts). Every component uses these tokens; no hardcoded colors.

The learner's **"Pétrole"** palette (between blue and green, with an apricot touch). **Light theme only**: no dark mode (`color-scheme: light`), since a dark background doesn't suit a menu.

| Token | Value | Use | shadcn mapping |
|---|---|---|---|
| `--bg` | `#FFFFFF` | Page background | `--background` |
| `--surface` | `#E9F2F3` | Cards, photo drop zone | `--card`, `--muted`, `--secondary` |
| `--border` | `#D0E0E2` | Dividers, card outlines | `--border` |
| `--ink` | `#13282D` | Main text | `--foreground` |
| `--ink-soft` | `#4F6469` | Secondary text, hints | `--muted-foreground` |
| `--petrol` | `#1D6273` | Actions, links, focus ring | `--primary`, `--ring` |
| `--petrol-hover` | `#174F5D` | Hover and active state | hover variant |
| `--apricot` | `#F8CFA0` | **"Menu ready" moment only** | none (used directly) |
| `--apricot-ink` | `#5C3209` | Text on apricot | none |
| `--input-border` | `#7A9298` | Input and switch outlines | `--input` |
| `--danger` | `#B3412E` | Delete confirmation button, error messages | `--destructive` |

**Contrast** (checked against WCAG AA, 4.5:1 for text): ink/bg 15.3, ink-soft/surface 5.5, white/petrol 6.9, petrol/surface 6.1, apricot-ink/apricot 7.5. The two tokens added in this spec and accepted by the learner: `--input-border` gives 3.3:1, the 3:1 that form-field outlines need (`--border` is 1.4:1, fine for dividers only); `--danger` gives 5.7:1 with white text.

**Cards** (Uxcel-style, as the learner observed on the Mobbin reference):
- White page background.
- Cards are filled with `--surface` (`#E9F2F3`) and have a **1 px tone-on-tone hairline in `--border` (`#D0E0E2`)**, one step darker than the fill.
- Generous, consistent radius.
- Used **sparingly**: the H1, subtext and other text sit directly on the page, not in boxes.
- Elements inside a card (inputs, the QR code) sit on white.
- `--border` also separates dish rows.
- No drop shadows.

**Headings:** Fraunces in `--ink` (`#13282D`), the same color as body text; the typeface carries the contrast.

**Apricot rule:** it appears in exactly one place, a "Menu ready" badge next to the restaurant name on the Menu screen, right after a new restaurant is created. It is never used for buttons or decoration.

| Other token | Direction |
|---|---|
| Headings | Fraunces (H1, restaurant name, section titles) |
| Body / UI | DM Sans |
| Radius | Moderate and consistent (around 10 px; buttons and cards as in the learner's Pétrole sample) |

### Density and tone
- **Spacious and calm.** Few elements per screen; you see what the platform offers at first glance.
- **Short, plain English copy.** Little text, but understandable.

### Reference
- The Uxcel hero from Mobbin (navbar, H1, subtext, two buttons), with the buttons acting as tabs.
- The screenshot goes in `design-reference/`, which is gitignored: it is a third-party screenshot.

### Hard rules for the build agent
- No emoji, no em dashes in any copy.
- No chalkboard or slate imagery, no purple gradients.
- No nav links; no title-top / icons-bottom / hamburger-top-left layout.
- Don't ship shadcn's default zinc theme or the Inter font.
- No dark theme. No apricot outside the "Menu ready" badge.
- No white cards with a mid-grey outline, no drop shadows, no boxing of every element: cards are `--surface` fills with a `--border` hairline.
- No colored stripe on one side of a card, quote or alert (the accent `border-left` / `border-right` pattern).

## Components

### Frontend

#### `HomePage` and `Hero`
Navbar (small logo, no links), H1, subtext, and two buttons that switch shadcn `Tabs`. `Existing menu` is the default tab. After a successful lookup or creation, the page replaces the tabs area with `MenuEditor`.
PRD ref: `prd.md > Screens and Layout > Home screen`.

#### `ExistingMenuForm`
Code input + Validate button. Input is case-insensitive and the dash is optional. Calls `GET /api/manage`. A 404 shows "Restaurant not found" under the field.
PRD ref: `prd.md > Find an existing menu`.

#### `NewRestaurantForm` and `compressImage`
Restaurant name (required, first) and a multi-image input (up to 5). `compressImage.ts` decodes each file with `createImageBitmap(file, { imageOrientation: "from-image" })`, draws it on a canvas at max 1600 px long edge, and exports it with `toBlob("image/jpeg", 0.8)`. Re-encoding through a canvas drops EXIF metadata (including GPS position). The form then uploads with progress events and hands off to `ProcessingSteps`.
PRD ref: `prd.md > Create a menu from photos`.

#### `ProcessingSteps`
Shows "Uploading photos…" while bytes are being sent, then "Reading your menu…" until the response arrives. The current step is highlighted; there is no percentage.
PRD ref: `prd.md > Screens and Layout > Processing state`.

#### `MenuEditor` and `DishRow`
- **Header:** the restaurant name in Fraunces, read-only. Right after a creation, an apricot "Menu ready" badge sits next to it.
- **`DishRow`:** displays the name, the formatted price, a pencil, an x and a `Switch`.
- **Editing:** the pencil turns the name and price into inputs, and the pencil becomes a check. The check saves the change (PATCH). It is disabled while the name is empty.
- **Delete:** the x opens an `AlertDialog`; confirming sends a DELETE.
- **Active/inactive:** the `Switch` sends PATCH `{active}`. An inactive row is dimmed.
- **Add dish:** appends an empty row already in edit mode; the check sends a POST.
- **Empty extraction:** if `extraction_empty`, a message reads something like "We couldn't find any dishes. Try a clearer photo, or add your dishes below."
- **Updates:** optimistic only where trivial; otherwise the row updates on the API's response, and an error message appears on the row if the call fails.

PRD ref: `prd.md > Edit the menu`, `prd.md > States and Boundaries`.

#### `QrPanel`
`QRCodeCanvas` for `${window.location.origin}/${slug}`, a download icon (canvas `toDataURL("image/png")`, file `paper-to-qr-<slug>.png`), and the code shown as `K7Q-29P` with a short "Keep this code to edit your menu" line.
PRD ref: `prd.md > Get the QR code and the code`.

#### `CustomerMenuPage`
Route `/:slug`. Calls `GET /api/menus/{slug}` and shows the restaurant name and the active dishes with prices. On 404: "Restaurant not found". With zero active dishes: the name plus "No dishes available right now". Mobile-first layout.
PRD ref: `prd.md > View the menu as a customer`.

#### `lib/api.ts` and `lib/formatPrice.ts`
- `api.ts`: typed fetch wrappers for every endpoint. The upload uses `XMLHttpRequest` for progress.
- `formatPrice(cents)`: returns `"12.50 €"`, or an empty string when the price is null.

### Backend

#### `app/main.py`
FastAPI app with routers under `/api`, plus `handler = Mangum(app)` for Lambda.

#### `app/extraction.py`
`extract_dishes(images: list[bytes]) -> list[ExtractedDish]`. One `client.messages.parse(model="claude-haiku-5-5", output_format=ExtractedMenu, output_config={"effort": "low"}, ...)` call with every image as a base64 `image` block, plus a short instruction:
- extract every dish with its price;
- normalize prices like "12,5", "12€50" or "12.50 €" to a decimal number of euros;
- use null when no price is legible;
- ignore section titles, the restaurant name and decorations.

On `stop_reason == "refusal"`, an API error or a timeout, it returns an empty list. The restaurant is still created and the UI shows the manual-entry path.
PRD ref: `prd.md > Create a menu from photos`.

#### `app/codes.py`
- `new_code()`: 6 characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (no 0/O, 1/I/L), shown as `XXX-XXX`, normalized to uppercase without the dash for storage. Retries if it collides with an existing code.
- `unique_slug(name)`: ASCII lowercase, hyphenated (`Chez Marcel` → `chez-marcel`). If the slug is taken, it appends `-2`, `-3` and so on.

PRD ref: `prd.md > Product Decisions` (same name, different URLs; short, easy-to-copy code).

#### Routes

| Method & path | Body / header | Response | Notes |
|---|---|---|---|
| `POST /api/restaurants` | multipart: `name`, `images` (1 to 5) | 201 `RestaurantPrivate` | 422 if the name is empty or there are no images |
| `GET /api/manage` | header `X-Menu-Code` | 200 `RestaurantPrivate` | 404 `{"detail": "Restaurant not found"}` |
| `POST /api/manage/dishes` | `X-Menu-Code`; `{name, price_cents}` | 201 `Dish` | 422 if the name is blank |
| `PATCH /api/manage/dishes/{dish_id}` | `X-Menu-Code`; any of `{name, price_cents, active}` | 200 `Dish` | 404 for an unknown code or dish |
| `DELETE /api/manage/dishes/{dish_id}` | `X-Menu-Code` | 204 | |
| `GET /api/menus/{slug}` | none | 200 `{name, dishes: [{name, price_cents}]}`, active dishes only | 404 if the slug is unknown |

- The code travels in a header rather than in the URL, so it doesn't end up in CloudFront or API Gateway access logs.
- `RestaurantPrivate` is `{name, slug, code, dishes: Dish[], extraction_empty}`.
- `Dish` is `{id, name, price_cents, active}`.

#### `app/db.py`
A module-level `MongoClient`, reused across warm Lambda invocations, with unique indexes on `code` and `slug`, created at startup.

## Data Model

Collection `restaurants`, one document per restaurant:

```json
{
  "_id": "ObjectId",
  "name": "Chez Marcel",
  "slug": "chez-marcel",
  "code": "K7Q29P",
  "dishes": [
    { "id": "uuid4-string", "name": "Quiche lorraine", "price_cents": 950, "active": true }
  ],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

| Data | Where it lives | How it's updated | When the user leaves and comes back |
|---|---|---|---|
| Restaurant name, slug, code | MongoDB | Written once at creation; never changed | Retrieved by code (manager) or slug (customer) |
| Dishes | MongoDB, embedded array | `$push` (add), `$set` on `dishes.$` matched by `id` (edit, toggle), `$pull` (delete) | Same as above, always fresh from the API |
| Photos | Browser memory, then the Lambda request only | Never stored | Gone |
| QR code | Not stored; drawn from `origin + slug` | n/a | Redrawn identically every time |
| Code typed by the manager | React state only | n/a | Must be typed again (no session, by design) |

Prices are stored as integer cents to avoid float rounding, and shown as `12.50 €`.

## File Structure

```
paper-to-qr/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts            # dev proxy /api -> localhost:8000
│   ├── components.json           # shadcn config
│   └── src/
│       ├── main.tsx              # router: "/" HomePage, "/:slug" CustomerMenuPage
│       ├── index.css             # Tailwind + imports theme.css and fonts
│       ├── styles/theme.css      # design tokens; written FIRST
│       ├── lib/
│       │   ├── api.ts            # fetch/XHR wrappers for every endpoint
│       │   ├── compressImage.ts  # resize to 1600px, JPEG, strips metadata
│       │   ├── formatPrice.ts    # cents -> "12.50 €"
│       │   └── utils.ts          # shadcn cn()
│       ├── components/
│       │   ├── ui/               # shadcn: button, input, tabs, alert-dialog, switch
│       │   ├── Navbar.tsx
│       │   ├── Hero.tsx
│       │   ├── ExistingMenuForm.tsx
│       │   ├── NewRestaurantForm.tsx
│       │   ├── ProcessingSteps.tsx
│       │   ├── MenuEditor.tsx
│       │   ├── DishRow.tsx
│       │   └── QrPanel.tsx
│       └── pages/
│           ├── HomePage.tsx
│           └── CustomerMenuPage.tsx
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app + Mangum handler
│   │   ├── config.py             # env vars
│   │   ├── db.py                 # Mongo client + indexes
│   │   ├── models.py             # Pydantic: ExtractedMenu, Dish, RestaurantPrivate...
│   │   ├── extraction.py         # Claude Haiku 5.5 call
│   │   ├── codes.py              # code + slug generation
│   │   └── routes/
│   │       ├── restaurants.py    # POST /api/restaurants
│   │       ├── manage.py         # /api/manage...
│   │       └── menus.py          # GET /api/menus/{slug}
│   ├── tests/
│   │   ├── test_codes.py
│   │   └── test_api.py           # mongomock + extraction stubbed
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── .env.example
├── template.yaml                 # SAM: Lambda, HTTP API, S3, CloudFront, CF Function
├── design-reference/             # gitignored: Uxcel screenshot
├── README.md
└── devpost/                      # Devpost learning workspace
```

## External Services and Dependencies

### Anthropic API (Claude Haiku 5.5)
- **Call:** `client.messages.parse(model="claude-haiku-5-5", max_tokens=4000, output_config={"effort": "low"}, output_format=ExtractedMenu, messages=[{"role": "user", "content": [<image blocks>, <instruction text>]}])`, then read `response.parsed_output`.
- **Schema:** `ExtractedMenu = {dishes: [{name: str, price: float | None}]}`.
- **Image block:** `{"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": <b64>}}`.
- **Key:** `ANTHROPIC_API_KEY` (env var; a SAM `NoEcho` parameter in deployment).
- **Cost:** $0.10 / $0.50 per million input / output tokens. A 1600 px photo is in the low thousands of tokens, so a menu costs well under one cent.
- **Notes:** Haiku 5.5 has no server-side fallback on refusals, so we handle `stop_reason == "refusal"` ourselves. Effort defaults to `medium`; set `low` explicitly and raise it if extraction quality is poor.
- **Docs:** vision https://platform.claude.com/docs/en/build-with-claude/vision; structured outputs https://platform.claude.com/docs/en/build-with-claude/structured-outputs; pricing https://claude.com/pricing.

### MongoDB Atlas
- **Setup:** a free M0 cluster, one database `paper_to_qr`, one collection `restaurants`.
- **Connection:** `MONGODB_URI` (SRV string).
- **Docs:** https://www.mongodb.com/docs/atlas/

### AWS (via SAM)
- **Lambda:** Python 3.12, 512 MB, 29 s timeout.
- **HTTP API:** a `/api/{proxy+}` route to the Lambda.
- **S3:** a private bucket, read by CloudFront through Origin Access Control.
- **CloudFront:**
  - the default behavior goes to S3, with a **CloudFront Function** that rewrites any path without a file extension to `/index.html`, so `/chez-marcel` loads the app;
  - `/api/*` goes to the HTTP API, with caching disabled and all query strings and headers (except Host) forwarded.
  - We **don't** use CloudFront custom error responses for the SPA fallback: they would also turn the API's 404 "Restaurant not found" into `index.html`.
- **Limits to verify early:** the Lambda synchronous payload (about 6 MB), the HTTP API's maximum timeout (about 30 s), and base64 inflation of the multipart body (about +33%). With 5 photos of about 400 KB each, there is enough headroom.
- **Docs:** https://docs.aws.amazon.com/serverless-application-model/, https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-functions.html

## Important Failure Modes

- **Extraction can't read the photo, or Claude refuses or errors** → the restaurant is still created; the Menu screen shows the "clearer photo or add your dishes below" message with an empty list.
- **Extraction is too slow (over about 29 s)** → the request fails with a 503/504; the form shows "Reading your menu took too long. Try again with fewer photos." No restaurant is created.
- **The browser can't decode a photo** (for example HEIC in Chrome) → `compressImage` throws; the form shows "This image format isn't supported. Try a JPEG or PNG photo." before anything is uploaded.
- **Unknown code or slug** → the API returns 404; the form or the customer page shows "Restaurant not found".

## What Was Simplified and Why

- **The QR code is drawn in the browser** instead of being stored as an image. The learner agreed: it is fully determined by the URL, so storing it adds nothing.
- **One Lambda for the whole API** instead of one per route. It is simpler to deploy and debug, and the traffic is tiny.
- **One request per menu** (upload + extraction + save) instead of a job queue with polling. The steps shown are honest without streaming. The fuller version would need S3 uploads, an async job and status polling.
- **The code is stored in plain text** instead of hashed. It is the only key to a low-stakes menu; hashing would be easy to add later (store a SHA-256 hash and look up by hash).
- **Atlas open to `0.0.0.0/0`** instead of VPC peering or PrivateLink. A Lambda outside a VPC has no fixed IP, and the data is throwaway.
- **No session for the manager:** the code is typed again after a reload, as intended by the kernel ("no account").

## Decisions and Open Issues

### Learner decisions
- **Claude Haiku 5.5:** "the cheapest model possible". Tradeoff: if handwriting is read poorly, the model can be swapped by changing one line.
- **Compress photos in the browser and strip metadata:** keeps uploads under Lambda limits and removes GPS and other EXIF data.
- **Show steps, not a percentage.**
- **shadcn/ui kept, restyled with a project theme written before any screen.**
- **QR code not stored, only the slug.**
- **S3 + CloudFront for the front, HTTP API + Lambda for the API, one CloudFront distribution, described with SAM.**
- **Prices displayed as `12.50 €`.**
- **Cards filled with `#E9F2F3` on a white page, with a 1 px `#D0E0E2` tone-on-tone hairline, used sparingly:** the learner found outlined white cards "a bit AI-slop", then noticed on Uxcel that a very faint hairline on a filled block reads as polished, not generic.
- **Headings in `--ink` (`#13282D`):** the learner tried a colored heading (warm brown `#5C3209`) and went back to ink.
- **`--input-border` and `--danger` tokens:** proposed by the agent, accepted by the learner.
- **The "Pétrole" palette, light theme only:** "a dark background doesn't work for a menu". Apricot is reserved for the "menu ready" moment.

### Derived by the agent (not discussed in detail)
- TypeScript for the frontend.
- The code alphabet and format (`XXX-XXX`).
- Slug collisions resolved with `-2`, `-3`.
- The code sent in an `X-Menu-Code` header.
- Price can be null when unreadable: the line shows no price, and the manager can fill it in.
- Max 5 photos per upload.
- The exact place of the "Menu ready" badge.
- A CloudFront Function for the SPA fallback.

### The useful unknown: "Is AI slop my instructions or the agent?"
- **What clarified it:** a lot of the generic look comes from defaults nobody replaces (shadcn's zinc theme, Inter, default radius and shadows), not only from vague prompts.
- **What we'll do:** write `theme.css` before any screen, give the agent the reference and the "avoid" list, and keep shadcn for behavior only.
- **Evidence during the build:** at the first UI step, compare the Home screen with `prd.md > Look and Feel` (features visible at first glance, little text, balance, none of the avoid list), and note in the learning journal what changed the result.

### Open
- **Verify early in the build:** Haiku 5.5's max image resolution and its extraction quality on a real chalkboard photo, current package versions, and the HTTP API / Lambda limits.
