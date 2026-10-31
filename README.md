# Raja Handloom - Memo / Billing App

Single-page billing app: categories and sub-categories, products with design photos,
a Designs section (segment > category > sub-category), cart with editable price and quantity,
bill history with search, daily / monthly sales report, customer GST, PDF bills with logo, and backup / restore between phones.
No build step and no database needed. Everything is saved in each phone's browser.

## Put it online (GitHub Pages)
1. Upload all files in this folder to a GitHub repository.
2. Repo Settings -> Pages -> Deploy from branch `main`, folder `/ (root)`.
3. Open the Pages link in Chrome on each phone. Use "Add to Home screen" to install it with the logo icon.

## Using more than one phone (Backup / Restore)
1. On the main phone add your designs, products and photos.
2. Home screen -> **Backup / Restore**. Tick what to put in the file:
   **Designs** (with all segments, categories, sub-categories and photos), **Products**,
   **Shop details**, **Bills**. Then tap **Save file**, or **Share (WhatsApp)** to send it.
   For example, tick only Designs to send only the designs.
3. On the other phone: **Backup / Restore -> Choose backup file** -> pick the file.
   A list shows what is inside; tick what to restore and tap **Restore ticked items**.
4. Ticked items on that phone become the same as in the file: added items appear and
   removed items disappear. Bills are only added (this phone's own bills are kept, nothing is repeated).
5. To bring the other phone's bills to the main phone: on the other phone tick only **Bills**, save or
   share the file, then restore it on the main phone.
6. In Manage -> This phone, give each phone a name and a bill prefix (for example M, R) so bill
   numbers do not clash and you can see which phone made each bill.

Make a backup regularly. If a phone's browser data is cleared, its data is lost unless you have a backup file.

## Project files
```
index.html        page structure (top bar, screen area, pop-up area)
css/style.css     all styles (colours are variables at the top)
images/logo.png   your logo (top bar and bill). Replace this file to change the logo
js/state.js       app data (S), saved settings, small helper functions
js/ui.js          pop-ups (message, confirm, rename) and photo picker
js/shop.js        Memo / Bill: shop, cart, history, manage screens
js/bill.js        creating a bill, bill number, bill text
js/pdf.js         PDF bill: drawing, PDF file, save and share
js/designs.js     Designs section: segments, categories, sub-categories, photos
js/report.js      Report tab: daily and monthly sale, items sold
js/backup.js      Backup / Restore screen and functions
js/app.js         home screen, screen switching, app start
manifest.json     home-screen app name and icons
sw.js             lets the app open without internet
icon-*.png        app icons made from the logo
```
Each function has a one-line comment above it saying what it does.
