# Talisay Beach Resort - Tour & Booking Management System

A complete, fully functional multi-page web application built with **HTML5, CSS3, and JavaScript (Vanilla ES6)** based on the prototype UI screens for Talisay Beach Resort in Tabina, Zamboanga del Sur.

---

## 🌟 Pages & Architecture

All pages are cleanly separated, fully responsive, and interactive:

### 🔐 Authentication & Accounts
- [`index.html`](index.html): Login page with interactive **User** and **Admin** role switcher, remember me, and demo auto-fill.
- [`register.html`](register.html): Account creation page with interactive **Terms and Conditions Modal** featuring all 10 resort rules and an "I AGREE" button.
- [`forgot.html`](forgot.html): Password recovery page supporting registered email reset with instant feedback.

### 🏖️ Guest & User Portal
- [`home.html`](home.html): Main resort dashboard featuring the tropical hero section, *"Book Your Stay"* call-to-action, *"A Coastal Haven in Tabina"* section, photo highlights, and interactive footer.
- [`facilities.html`](facilities.html): Resort amenities showcase (Beachfront, Starlight Camping, Native Cottages, Twilight Gazebos) with direct booking links.
- [`gallery.html`](gallery.html): Interactive photo gallery with category filter pills (*All, Beach & Sunset, Night Ambiance, Camping, Cottages*) and full-screen image lightbox preview.
- [`availability.html`](availability.html): Interactive booking builder with check-in/check-out date pickers, accommodation selection cards, real-time cost calculation (nights × rate in ₱ PHP), payment method selection, and downpayment confirmation.
- [`downpayment.html`](downpayment.html): Standalone downpayment page displaying the exact confirmation dialog (*"Done Payment - Arigathanks!!"*).
- [`contact.html`](contact.html): Contact directory (phone `09979051718`, email `kissko@gmail.com`, location) and interactive guest inquiry form.

### 🛡️ Admin Portal
- [`admin-dashboard.html`](admin-dashboard.html): High-level operational overview featuring 5 real-time stat cards (*Total Bookings, Total Visitors, Used Facilities, Reserved Facilities, Total Revenue*), functional **Export dropdown** (CSV, PDF, Excel), and quick Approve/Reject buttons for recent bookings.
- [`admin-reservations.html`](admin-reservations.html): Full booking management with status filtering (*All, Pending, Approved, Rejected*), live keyword search, status changing, detail viewer, and deletion.
- [`admin-users.html`](admin-users.html): Guest account directory with user search, profile viewer, name editing, and account status toggling (*Active / Banned*).

---

## 🔑 Credentials & Access

| Role | Username | Password | How to Access |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Select **Admin** on login page -> log in to `admin-dashboard.html` |
| **User (Guest)** | *(Registered by user)* | *(Set by user)* | Create an account via [`register.html`](register.html) |

*Note: There is no longer a hardcoded default user account. Guests create their own accounts by clicking "REGISTER HERE" on the login page.*

---

## 🚀 How to Run

### Option 1: Double-Click Localhost Server (Recommended)
- Simply double-click [`start-server.bat`](start-server.bat) in this folder.
- A local web server will launch at: **`http://localhost:8080`** and open your browser automatically.
- No Node.js or Python installation required (uses Windows built-in PowerShell web server).

### Option 2: Direct File Open
- Double-click [`index.html`](index.html) in your file manager to open it in your default web browser.

### Option 3: PowerShell Command Line
- Run: `powershell -ExecutionPolicy Bypass -File .\server.ps1`

---

## ☁️ Firebase Realtime Cross-Device Synchronization

This project supports live multi-device synchronization using **Firebase Realtime Database**. When enabled, any booking made on a mobile phone immediately reflects on admin laptops/tablets in real time without refreshing!

### How to Enable Firebase Cloud Sync:

1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add Project**.
2. Go to **Build > Realtime Database** and click **Create Database** (select any region, e.g. `asia-southeast1` or `us-central1`).
3. In the **Rules** tab of Realtime Database, apply the rules from [`database.rules.json`](database.rules.json):
   ```json
   {
     "rules": {
       "talisay_resort": {
         ".read": true,
         ".write": true
       }
     }
   }
   ```
4. Go to **Project Settings > General > Your apps**, select **Web app (`</>`)**, and copy your Firebase config object.
5. Paste your keys into [`assets/js/firebase-config.js`](assets/js/firebase-config.js):
   ```javascript
   const defaultFirebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
   *(Alternatively, open any page in your browser and run `TalisayCloud.openConfigModal()` in the DevTools console to paste your config without editing code!)*

> [!NOTE]
> If Firebase credentials are not provided or you are offline, the system automatically falls back to browser **LocalStorage** so the app continues to work seamlessly.

---

## 🔒 Security & Deployment Checklist

Before deploying this website to production or sharing public access:
1. **Change Default Admin Password**: The default demo admin is `admin` / `admin123`. Change this in [`assets/js/db.js`](assets/js/db.js) or through the admin interface.
2. **Restrict Firebase Rules**: In production, secure your Realtime Database rules with Firebase Authentication so only authorized staff can approve/reject bookings.
3. **Contact Details**: Review resort phone numbers and email addresses in [`contact.html`](contact.html) before launch.

---

## 📦 Pushing to GitHub

To push this repository to GitHub:

```bash
# 1. Initialize git (if not already initialized)
git init

# 2. Add files (large mockups are neatly organized in docs/)
git add .

# 3. Create initial commit
git commit -m "Initial commit: Talisay Beach Resort Tour & Booking Management System with Firebase Realtime Sync"

# 4. Link to your GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

