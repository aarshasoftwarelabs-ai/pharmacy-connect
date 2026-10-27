# DavaSetu Pharmacy Web Portal - Free Deployment Guide

This guide explains how to run the pharmacy portal directly in the web browser and host it for **100% Free** on **Vercel** or **Netlify**.

---

## 1. Local Development (Web Browser)

To run the web application on your local machine:
```bash
cd pharmacy_pc
npm run dev
```
Open your browser at:
`http://localhost:5173`

---

## 2. Deploying for Free on Vercel (Recommended)

### Method A: Via GitHub (Continuous Deployment - Instant Updates)
1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com) and log in (using your GitHub account).
3. Click **"Add New..."** -> **"Project"**.
4. Import your `pharmacyconnect` repository.
5. In the Project Configuration:
   - **Root Directory**: Select `pharmacy_pc` (Click "Edit" next to Root Directory and pick `pharmacy_pc`).
   - **Framework Preset**: Vite (detected automatically).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Click **Deploy**.
7. In ~45 seconds, your website will be live with a free HTTPS URL like:
   `https://davasetu-pharmacy.vercel.app`

> **Instant Updates:** Whenever you edit code and push to GitHub, Vercel automatically updates your website immediately! All pharmacy shops will see the new version upon page reload.

---

### Method B: Via Vercel CLI (Without GitHub)
Run this command from inside `pharmacy_pc`:
```bash
npx vercel
```
Follow the on-screen prompts, and it will deploy your app directly from your computer!

---

## 3. Deploying on Netlify (Drag & Drop)

If you don't want to connect GitHub and prefer a 1-click upload:
1. Run build:
   ```bash
   npm run build
   ```
2. Go to [Netlify Drop](https://app.netlify.com/drop).
3. Drag and drop the `dist` folder created inside `pharmacy_pc/`.
4. Your website is instantly live!

---

## 4. Environment Variables

Your web app is already pre-configured to automatically connect to your live cloud backend:
- Cloud Backend: `https://pharmacy-backend-e210.onrender.com/api`
- Socket Server: `https://pharmacy-backend-e210.onrender.com`

If you want to override these in Vercel, simply add:
- `VITE_API_URL`
- `VITE_SOCKET_URL`
in your Vercel Project Settings -> Environment Variables.

---

## 5. Thermal Printing on Web

- Works directly with standard browser printing (`window.print()`).
- In Chrome/Edge, you can set the default printer to your Thermal Printer (58mm or 80mm).
- For instant 1-click silent printing without dialogs, launch Chrome with `--kiosk-printing`:
  ```
  chrome.exe --kiosk-printing https://your-domain.vercel.app
  ```
