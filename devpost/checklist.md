---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. A menu photo becomes a list of dishes on screen**
  Becomes usable: On the Home screen, the manager opens the New restaurant tab, enters a name, uploads one or more photos, sees "Uploading photos…" then "Reading your menu…", and lands on the Menu screen with the restaurant name, the "Menu ready" badge, the extracted dishes with prices and the code. The restaurant is saved in Atlas. The Existing menu tab is visible but only wired in slice 2.
  Why now: This is the unique kernel and the riskiest part (handwritten chalkboard, a model never tested on this). Finding out on the first slice whether Haiku 5.5 reads a real menu, and how long it takes, decides everything else. It also sets the look of the app before any other screen exists, which is the learner's learning goal.
  PRD ref: `prd.md > The Core Journey` (steps 1-4), `prd.md > Screens and Layout` (Home screen, Processing state, Menu screen a, b, d), `prd.md > Create a menu from photos`, `prd.md > States and Boundaries` (no dishes extracted), `prd.md > Look and Feel`
  Spec ref: `spec.md > Stack`, `spec.md > Where It Runs and How Someone Tries It > Local development`, `spec.md > Look and Feel`, `spec.md > Components` (HomePage and Hero, NewRestaurantForm and compressImage, ProcessingSteps, MenuEditor and DishRow read-only, app/main.py, app/extraction.py, app/codes.py, app/db.py, Routes: POST /api/restaurants), `spec.md > Data Model`, `spec.md > File Structure`, `spec.md > External Services and Dependencies` (Anthropic API, MongoDB Atlas), `spec.md > Important Failure Modes`
  Build: First check the unverified points (current package versions, Haiku 5.5 image limits and structured outputs). Scaffold `backend/` (FastAPI, config, db with unique indexes, models, codes, extraction, POST /api/restaurants, Mangum handler) and `frontend/` (Vite + React + TS, Tailwind, shadcn, fonts, router). Write `styles/theme.css` before any screen. Build Navbar, Hero with the two tab buttons, NewRestaurantForm with compressImage and XHR upload progress, ProcessingSteps, and a read-only MenuEditor (name, badge, dish rows, code, empty-extraction message, failure messages).
  Verify (mechanical): `pytest` passes (`test_codes.py`, and `test_api.py` with mongomock and extraction stubbed: creation, empty name, no images, empty extraction). A real extraction run on a menu photo returns dishes with prices; log its duration and the request size. `npm run build` passes with no type errors. With both dev servers running, a curl multipart POST returns 201 with a code and a slug, and the document is in Atlas.
  Learner check: Run both dev servers, open `http://localhost:5173`, look at the Home screen, then create a restaurant with a real photo of a menu (ideally a handwritten one). Say whether the extracted list matches the photo, and whether the Home and Menu screens feel like the Uxcel reference and the "Pétrole" look you chose, or slip into anything on the avoid list.
  Commit: `Create a restaurant from menu photos with Claude extraction`

- [x] **2. The customer scans the QR code, and the manager comes back with the code**
  Becomes usable: The Menu screen shows the QR code with a download icon. Scanning it with a phone on the same Wi-Fi opens `/restaurant-slug` with the name and dishes. Pasting the code in the Existing menu tab opens the same Menu screen; an unknown code shows "Restaurant not found" on the form, and an unknown slug shows a "Restaurant not found" page.
  Why now: It completes the "oh, that's cool" moment (a real photo, then a real phone scan) right after the kernel works. Both behaviors are lookups on the same document (by slug and by code), so they share one slice.
  PRD ref: `prd.md > The Core Journey` (steps 6-8), `prd.md > Get the QR code and the code`, `prd.md > Find an existing menu`, `prd.md > View the menu as a customer`, `prd.md > Screens and Layout` (Menu screen c, Customer page)
  Spec ref: `spec.md > Components` (QrPanel, CustomerMenuPage, ExistingMenuForm, lib/api.ts, Routes: GET /api/manage, GET /api/menus/{slug}), `spec.md > Where It Runs and How Someone Tries It > Local development` (LAN address for the phone)
  Build: QrPanel (QRCodeCanvas on `window.location.origin + "/" + slug`, PNG download named `paper-to-qr-<slug>.png`, code shown as `XXX-XXX`). GET /api/menus/{slug} (active dishes only) and CustomerMenuPage with the not-found and no-active-dish states, mobile-first. GET /api/manage with `X-Menu-Code` and ExistingMenuForm (case-insensitive, optional dash, error under the field).
  Verify (mechanical): `pytest` covers lookup by code (valid, lowercase with dash, unknown) and by slug (active-only filter, unknown, no active dish). `npm run build` passes. curl both routes against the dev server. In the browser, the downloaded PNG decodes to the expected URL.
  Learner check: Open the site through the LAN address Vite prints, download the QR code, scan it with your phone and check that your menu appears. Then reload the Home screen, paste the code in Existing menu and check that you get your menu back; try a wrong code and an invented slug.
  Commit: `Add QR code, customer menu page and lookup by code`

- [x] **3. The manager fixes and updates the dishes**
  Becomes usable: On the Menu screen, the pencil makes the name and price editable and turns into a check that saves; the x opens a confirmation modal before deleting; Add dish appends a line in edit mode; the toggle marks a dish inactive (dimmed for the manager, hidden for the customer). A dish without a name can't be validated. Changes survive a reload with the code.
  Why now: Editing is the safety net for misread extractions and the reason the manager comes back. It builds on the code and the customer page from slice 2, which is how the toggle can be checked end to end.
  PRD ref: `prd.md > The Core Journey` (step 5), `prd.md > Edit the menu`, `prd.md > States and Boundaries` (deleting, dish without a name, inactive dish, no dishes extracted)
  Spec ref: `spec.md > Components` (MenuEditor and DishRow, Routes: POST, PATCH, DELETE /api/manage/dishes), `spec.md > Data Model` (`$push`, `$set` on `dishes.$`, `$pull`)
  Build: The three manage dish routes with the code header. DishRow edit mode with inline inputs and the pencil/check swap, AlertDialog delete, Switch toggle, Add dish, row-level error messages, empty-name guard. Price input accepts `12,50` or `12.50` and is stored as cents.
  Verify (mechanical): `pytest` covers add, edit name and price, toggle, delete, blank name rejected, unknown dish and wrong code. `npm run build` passes. In the browser: edit, add, toggle and delete, reload with the code and confirm each change; confirm an inactive dish is missing from `/restaurant-slug`.
  Learner check: Fix a misread dish, add one, delete one (cancel once, then confirm), and turn one inactive. Reload your customer page on the phone and check that the inactive dish is gone and the fix shows. Then come back with the code and check everything stayed.
  Commit: `Edit, add, delete and toggle dishes`

- [ ] **4. The judges can open the site on AWS**
  Becomes usable: The whole journey works on a public CloudFront address: create from a photo, edit, download the QR code, scan it, come back with the code.
  Why now: Deployment changes nothing in the product, so it comes once the product is complete. Its main risk (payload size and extraction time against the Lambda and HTTP API limits) is already measured locally in slice 1, so surprises here should be configuration, not design.
  PRD ref: `prd.md > What We're Building` (deployed so the judges can see it)
  Spec ref: `spec.md > Where It Runs and How Someone Tries It > Deployment`, `spec.md > External Services and Dependencies` (AWS via SAM), `spec.md > Important Failure Modes` (extraction too slow)
  Build: `template.yaml` (Lambda Python 3.12 512 MB 29 s with Mangum, HTTP API `/api/{proxy+}`, private S3 bucket with OAC, CloudFront with the SPA-rewrite CloudFront Function and an uncached `/api/*` behavior, `NoEcho` parameters for the keys). Lambda packaging for the backend dependencies. A short deploy section in `README.md`. The learner runs or authorizes `sam deploy --guided` with her own AWS credentials; Atlas network access opened to `0.0.0.0/0`.
  Verify (mechanical): `sam validate` and `sam build` pass. After deploy, curl `https://<cloudfront>/api/menus/<slug>` returns JSON (and 404 JSON for an unknown slug, not `index.html`), `https://<cloudfront>/<slug>` returns the app, and a real photo upload through the deployed site returns 201 within the timeout.
  Learner check: On your phone, outside your Wi-Fi, open the CloudFront address, create a restaurant from a real menu photo, download and scan the QR code, then come back with the code.
  Commit: `Deploy to AWS with SAM, S3, CloudFront and Lambda`

## Hands-on Checkpoints

- [ ] Early usable behavior explored: after slice 1 (real photo extraction quality and the look of the Home and Menu screens, while feedback can still shape the rest of the UI)
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete: feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete: guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed: offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence:
Route and stops:
Edit outcome:
Reflection:
Activity mode:

## Revisions

- The Menu screen now opens inside the home panel, in place of the form, with the hero and tab buttons kept on screen: at the first hands-on check the learner felt that replacing the whole hero looked like being sent to another page.
- Dish edits address the dish by array index guarded by its id, instead of the positional `dishes.$`: mongomock applies `dishes.$` to the wrong element when the filter also matches `_id`, so the tests couldn't check the positional form; Atlas behaves the same either way.
- In edit mode the x cancels the edit (or discards an unsaved new line) instead of deleting, with Escape doing the same: a delete control next to the check would make it easy to lose a dish while fixing it.
