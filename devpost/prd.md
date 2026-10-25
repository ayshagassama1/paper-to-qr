---
doc: prd
status: approved
---

# Paper to QR: Product Requirements

Paper to QR turns a photo of a restaurant's paper or chalkboard menu into an editable digital menu, a code and a printable QR code. It's for the manager of a restaurant, café or bistro whose menu of the day changes often, and for the customers who scan the QR code at the table.

Source: `scope.md > The Unique Kernel` (no typing, no account) and `scope.md > The Core Loop`.

## The Core Journey

1. The manager opens the site and lands on the **Home screen**: a small logo in the navbar, a short H1 explaining the platform, a more detailed subtext, and two buttons that open two tabs: **Existing menu** (open by default) and **New restaurant**.
2. **New restaurant:** the manager enters the restaurant name (top field) and uploads one or more photos of the menu, then submits.
3. While the photos are processed, the screen shows the **current step** ("Uploading photos…", "Reading your menu…") rather than a percentage.
4. The **Menu screen** appears with the restaurant name, the extracted dishes and prices, the QR code with a download button, and the code to keep.
5. The manager fixes what the extraction misread by editing a line in place, deletes lines that don't belong, adds missing dishes, and marks unavailable dishes as inactive. Each change is saved when it is validated.
6. The manager downloads the QR code and prints it for the tables.
7. **The customer** scans the QR code with a phone and lands on `/restaurant-slug`: the restaurant name and the active dishes with prices. Nothing else.
8. **Next day, the menu has changed.** The manager comes back, pastes the code in the **Existing menu** tab, validates, and gets the same Menu screen with the current menu, ready to edit.

Success: a real menu photo becomes a list of dishes on screen, and scanning the QR code with a real phone shows that menu (`scope.md > What "Working" Looks Like`).

## Screens and Layout

### Home screen
Layout inspired by the Uxcel landing page (found on Mobbin):
- **Navbar:** a small, friendly logo. No navigation links.
- **H1:** a short explanation of what the platform does.
- **Subtext:** a few more details, just enough to understand.
- **Two buttons** right below. They don't go to other pages; they switch between two tabs shown below them:
  - **Existing menu** (default): a text field for the code and a **Validate** button.
  - **New restaurant:** a **Restaurant name** field at the top, an image upload field (one or more images), and a submit button.

### Processing state
After the New restaurant form is submitted, the screen shows the current step in plain English until the Menu screen is ready.

### Menu screen
Shown after a valid code (Existing menu) or after processing (New restaurant). Identical in both cases:
- **a) Restaurant name** at the top. Not editable; it is what the QR code's URL is built from.
- **b) Dish list:** one line per dish with its name and price. Each line has a pencil icon (edit), an x icon (delete) and an active/inactive toggle. An **Add dish** action adds a new line.
- **c) QR code** image with a download icon.
- **d) The code** the manager needs to keep to come back later.

### Customer page (`/restaurant-slug`)
The restaurant name and the list of active dishes with prices. Nothing else.

## Look and Feel

- **Overall:** simple, clean, readable, and cosy at the same time.
- **The Uber and Instagram quality to aim for:** you see what the platform offers at first glance; there isn't a lot of text, but it is understandable; there is a balance.
- **Typography:** **Fraunces** for headings, **DM Sans** for body text.
- **Colors:** the learner's **"Pétrole"** palette, between blue and green with a touch of apricot. White background, light petrol-tinted surfaces, petrol for actions, and apricot only for the "menu ready" moment. Headings (Fraunces) in the main text color. Light theme only: a dark background doesn't work for a menu. Exact values in `spec.md > Look and Feel`.
- **Layout reference:** the Uxcel hero (navbar, H1, subtext, two buttons) on Mobbin (https://mobbin.com), adapted as described in Screens and Layout.
- **UI language:** English, for the judges.
- **Avoid:** emoji anywhere in the UI, em dashes in any text, chalkboard or slate imagery, generic AI-app styling (purple gradients, white cards with a mid-grey outline, drop shadows, a colored stripe on one side of a card, boxing every element). Cards are light fills with a very faint tone-on-tone hairline, used sparingly, as on Uxcel, and the generic layout of a title at the top, icons at the bottom and a hamburger menu at the top left.

## Features and Behavior

### Find an existing menu
Source: `scope.md > The Core Loop` (every time the menu changes).
- As a manager whose menu changed, I want to paste my code and see my menu so that I can update it.
  - [ ] The Existing menu tab is open by default on the Home screen.
  - [ ] Entering a valid code and clicking Validate shows the Menu screen with that restaurant's name, dishes, QR code and code.
  - [ ] Entering a code that doesn't exist shows an error message on the form, like "Restaurant not found", and the manager stays on the form.

### Create a menu from photos
Source: `scope.md > The Unique Kernel`.
- As a new manager, I want to upload photos of my menu so that I get a digital menu without typing it.
  - [ ] The New restaurant tab has a Restaurant name field at the top and an upload field that accepts one or more images.
  - [ ] After submitting, the screen shows the current step in plain English (for example "Uploading photos…", then "Reading your menu…").
  - [ ] When processing finishes, the Menu screen shows the extracted dishes with their prices, the QR code and the code.
  - [ ] With a real photo of a printed or handwritten menu, the dish list on screen matches the dishes on the photo, give or take a few fixable misreadings.

### Edit the menu
Source: `scope.md > The POC Boundary`, plus the add and toggle features decided in this PRD.
- As a manager, I want to fix and update dishes so that the menu online matches what I serve today.
  - [ ] Clicking the pencil makes the dish name and the price editable in place, and the pencil is replaced by a check icon (validate).
  - [ ] Clicking the check saves the change. Reloading the menu with the code shows the new value.
  - [ ] Clicking the x opens a confirmation modal. Confirming removes the dish from the list; cancelling keeps it.
  - [ ] Add dish adds a new line where the manager enters a name and a price, then validates it.
  - [ ] A dish without a name can't be validated.
  - [ ] Toggling a dish to inactive keeps it in the manager's list but hides it from the customer page; toggling it back shows it again.

### Get the QR code and the code
Source: `scope.md > The POC Boundary`.
- As a manager, I want a QR code I can print and a code I can keep so that customers can see my menu and I can come back.
  - [ ] The Menu screen shows the QR code image and a download icon; clicking it downloads the QR code as an image file.
  - [ ] Scanning the downloaded QR code with a phone opens this restaurant's `/restaurant-slug` page.
  - [ ] The code is displayed on the Menu screen, and pasting it in the Existing menu tab opens this menu.

### View the menu as a customer
Source: `scope.md > The Core Loop` (customer side).
- As a customer at the table, I want to scan the QR code and see the dishes and prices so that I can choose.
  - [ ] The page shows the restaurant name and the active dishes with their prices, and nothing else.
  - [ ] Inactive dishes don't appear.
  - [ ] A restaurant with no active dish shows its name and "No dishes available right now".
  - [ ] An unknown `/restaurant-slug` shows a simple "Restaurant not found" page.
  - [ ] A change saved by the manager shows up when the page is reloaded.

## States and Boundaries

- **First use (New restaurant):** the restaurant name is required.
- **Processing:** the current step is displayed until the Menu screen appears.
- **No dishes extracted:** the restaurant, its code and its QR code are still created. The manager sees a message asking for a better quality photo, and is offered to enter the menu by hand from an empty list using Add dish.
- **Unknown code:** an error message on the form ("Restaurant not found").
- **Deleting a dish:** a confirmation modal appears; the dish is removed only after confirming.
- **Dish without a name:** can't be validated.
- **Unknown `/restaurant-slug`:** a simple "Restaurant not found" page.
- **No active dish:** the customer page shows the restaurant name and "No dishes available right now".
- **Inactive dish:** visible to the manager, hidden from customers.
- **What persists:** restaurant name, code, QR code and dishes (name, price, active or not). Uploaded photos are never kept.
- **Who can do what:** whoever has the code can view and edit the menu. Anyone with the QR code or the URL can see the active dishes.

## Product Decisions

- **Tabs instead of separate pages:** the two buttons from the Uxcel-style hero open tabs on the same page. The learner sees no point in navigation links.
- **Existing menu is the default tab:** the returning manager is the most frequent visitor.
- **One Menu screen for both paths:** after a valid code or after processing, the manager gets exactly the same screen.
- **Restaurant name is not editable:** the QR code's URL is built from it.
- **Inline editing with a validate check:** the line becomes editable in place, and the pencil turns into a check to validate.
- **Step-based status instead of a progress bar:** processing time is unknown, so a percentage could mislead; showing the current step is more honest.
- **Add dish and active/inactive toggle are in:** the menu of the day changes and dishes run out. Add dish also gives a fallback when nothing is extracted.
- **Customer page shows only the name and active dishes:** nothing else.
- **English UI:** the judges are probably English-speaking.
- **Fraunces + DM Sans:** chosen over Montserrat, which is very common.
- **Name, "Paper to QR":** says what the product does.

- **Restaurant created as soon as processing finishes, even with no dish found:** the manager can then enter the menu by hand.
- **Delete asks for confirmation in a modal:** avoids losing a dish by mistake.
- **A dish needs a name:** a line without a name is not validated.
- **Two restaurants with the same name get different URLs:** each restaurant has its own QR code.
- **The code is short and easy to copy:** its exact format is decided in `4-spec`.
- **Unknown slug and empty menu have their own messages:** "Restaurant not found" page; name plus "No dishes available right now".

## What We're Building

- Home screen with the logo, H1, subtext and the two tab buttons.
- Existing menu tab: find a menu by code, with an error on an unknown code.
- New restaurant tab: restaurant name, upload of one or more photos, step-based processing status.
- Extraction of dishes and prices from the photos.
- Menu screen: read-only restaurant name, dish list with inline edit, delete, add and active/inactive toggle, downloadable QR code, displayed code.
- Fallback when nothing is extracted: message plus manual entry.
- Customer page `/restaurant-slug` with the name and active dishes.
- Deployed so the judges can see it.

## Deferred From the POC

- **Replacing the whole menu with a new photo:** the learner chose Add dish for daily changes; re-uploading can come later.
- **Recovering a lost code:** without accounts, a lost code means losing access to the menu. Recovery would need an email or an account, which goes against the kernel.
- **Renaming a restaurant:** the name drives the QR code's URL, so changing it would break printed QR codes.

## Possible Later Enhancements

- Customizing the customer page (colors, restaurant logo).
- Categories, descriptions and allergens.
- Re-uploading a photo to replace or extend the menu.

## Non-Goals

- **Accounts and authentication:** the code is the only key; that is the kernel.
- **Storing uploaded photos:** they are used for extraction only, then discarded.
- **Navigation links in the navbar:** the learner sees no use for them.
- **Anything on the customer page beyond the name and the active dishes.**

## Open Questions

- None. Accent color ("Pétrole" palette) and price display (`12.50 €`) were settled in `4-spec`.
