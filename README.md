# Raja Handloom - Memo / Billing App

Single-page billing app: categories and sub-categories, products with design photos,
cart with editable price and quantity, bill history, customer GST, PDF bills with logo,
and sync between phones. No build step.

## Put it online (GitHub Pages)
1. Upload all files in this folder to a GitHub repository.
2. Repo Settings -> Pages -> Deploy from branch `main`, folder `/ (root)`.
3. Open the Pages link in Chrome on each phone. Use "Add to Home screen" to install it with the logo icon.

## Sync between phones (Firebase, free plan)
1. Go to console.firebase.google.com -> Add project.
2. Build -> Firestore Database -> Create database (choose a nearby location, e.g. Mumbai) -> start in test mode.
3. Firestore -> Rules tab -> replace with the rules below -> Publish:

   rules_version = '2';
   service cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read, write: if true; } } }

4. Project settings (gear icon) -> General: copy the **Project ID**. Under "Your apps" add a Web app (</>) and copy its **apiKey**.
5. On every phone open the app -> Manage -> **Cloud sync** -> paste Project ID and API key -> Save and test sync.
6. Manage -> **This phone**: give each phone a name and bill prefix. Tick "This is the MAIN phone" on one phone only.

Security note: these rules let anyone who knows your Project ID and API key read and write the data. Keep them private.
To restrict the key, open Google Cloud Console -> APIs & Services -> Credentials -> your key -> limit it to your GitHub Pages website address.

## How sync works
- Main phone: sends products, categories, photos and shop details to the other phones, and receives all their bills.
- Other phones: receive products and photos from the main phone, and send their bills to it.
- Sync runs when the app opens, after each bill, and with the Sync button (internet needed).
- Make product and photo changes on the main phone only.

## Data
Everything is also kept in each browser (localStorage). Clearing browser data on a phone removes its local copy;
synced bills and the catalog stay in Firebase.

## Project files
```
index.html        page structure (top bar, screen area, pop-up area)
css/style.css     all styles (colours are variables at the top)
js/logo.js        your logo, embedded so it also works offline
js/state.js       app data (S), saved settings, small helper functions
js/ui.js          pop-ups (message, confirm, rename) and photo picker
js/shop.js        Memo / Bill: shop, cart, history, manage screens
js/bill.js        creating a bill, bill number, bill text
js/pdf.js         PDF bill: drawing, PDF file, save and share
js/designs.js     Designs section: segments, categories, sub-categories, photos
js/sync.js        sync between phones (Firebase)
js/app.js         home screen, screen switching, app start
manifest.json     home-screen app name and icons
sw.js             lets the app open without internet
icon-*.png        app icons made from the logo
```
Each function has a one-line comment above it saying what it does.
To change something, find the screen in the list above, edit that file and reload the page
(clear the site data or hard-refresh if the old version still shows).
