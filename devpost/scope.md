---
doc: scope
status: approved
---

# Paper to QR

A restaurant manager photographs their menu and gets an editable digital menu, a code and a printable QR code, with no typing and no account.

## The Unique Kernel
**No typing, no account.** Asking a restaurant manager to retype their whole menu into an app creates friction. Here, they take a photo of their chalkboard or printed menu and the list of dishes with prices appears. They can try it right away, "sans prise de tête" (no hassle).

## Who It's For
**The manager of a restaurant, café or bistro whose menu of the day changes often.** Prices change too, as ingredient costs keep rising. Today they write the menu in chalk or print it, crossing out the old price and writing the new one next to it.

**Their customers**, who scan the QR code on the table to see the menu.

## The Core Loop
- **First visit:** the manager opens the site, enters the restaurant name and uploads one or more photos of the menu. OCR extracts the list of dishes with prices. The manager fixes anything the OCR misread, then gets a code and a downloadable QR code.
- **Every time the menu changes:** the manager comes back, pastes the code, finds the restaurant name, dishes and QR code, and edits or deletes dishes.
- **Customer side:** the customer scans the QR code, lands on `/restaurant-slug` and simply sees the list of dishes with prices.

Why the manager comes back: the menu of the day and its prices change.

## Inspiration & Identity
- Very simple, basic, clean.
- UI references: Uber (https://www.uber.com) and Instagram (https://www.instagram.com). They are easy to use without having to look up "how to", and they have a certain *je ne sais quoi* that sets them apart from clean interfaces that all look alike (icons at the bottom, title at the top, hamburger menu at the top left).
- Mobbin (https://mobbin.com) as a possible source of references.
- To be explored further in `3-prd`, tied to the learning goal: getting an interface from an agent that doesn't feel like AI slop.

## Why This Matters to the Learner
"I find this project is a simple solution to a fairly common problem." Most restaurants the learner goes to still use paper menus. The project is also a playground for learning how to build a "unique, user-friendly, intuitive" interface with an agent.

## What "Working" Looks Like
"I upload an image and get a list of dishes with their prices, with the option to edit the name/price in case the OCR misread it. And at the bottom, a downloadable QR code to print for the end customer."

**The "oh, that's cool" moment:** a real menu (chalkboard or paper) is photographed and the list appears. Then the QR code is scanned with a real phone and the digital menu shows up.

The app is deployed so the judges can see the site.

## The POC Boundary
- Upload one or more menu photos, then extract dishes and prices with OCR.
- Editable list: change a dish's name or price, delete a dish.
- Generate a code (so the manager can come back) and a downloadable QR code pointing to `/restaurant-slug`.
- Returning manager: pastes the code and finds the restaurant name, dishes and QR code, ready to edit.
- Public page `/restaurant-slug`: the list of dishes with prices.
- Stored data: restaurant name, code, QR code and menu, in MongoDB Atlas.
- Stack and deployment chosen by the learner: React + FastAPI on CloudFront + Lambda (already used to deploying on AWS).

## Later
- To be settled in `3-prd`: adding a dish by hand, or replacing the menu with a new photo when the menu of the day changes.
- Customizing the customer page (colors, restaurant logo).
- Categories, descriptions, allergens.

## Explicitly Cut
- **Authentication and accounts:** this is the kernel. No account, the code is enough.
- **Storing uploaded images:** photos are used only for extraction and then discarded. Only the useful data is kept.

## Risk to Keep in Mind
Extracting text from a photo of a handwritten chalkboard is the most uncertain part, and it is also the heart of the demo. The editable list is the safety net. The extraction engine (classic OCR or a vision model) will be chosen in `4-spec`.
