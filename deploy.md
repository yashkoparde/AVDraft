# Deployment Instructions

## Option 1: Replit (Easiest)

1.  **Import to Replit:**
    - Create a new Repl and import this repository.
    - Or, simply upload the files if you are working locally.

2.  **Configuration:**
    - The `.replit` file is already configured to install dependencies and start the server.
    - Go to **Secrets** (Lock icon in Tools) and add:
        - `OPENAI_API_KEY`: Your OpenAI Key (optional).
        - `ADMIN_TOKEN`: A secure string for admin access.

3.  **Run:**
    - Click the big green **Run** button.
    - Replit will install packages and start the server.
    - A Webview window will open with your live app. The URL (e.g., `https://your-repl-name.username.replit.dev`) is public and can be shared.

**Note on Persistence:**
Replit generic Repls might sleep after inactivity. File writes (like `audit.log`) are generally preserved in the Repl's filesystem but ephemeral in some deployment types. The code handles this by attempting to write to `/tmp` if the local write fails.

## Option 2: Render (Recommended for Production)

If you want a permanent deployment outside of Replit:

1.  **Push to GitHub:**
    - Create a repository on GitHub and push this code.

2.  **Create Web Service on Render:**
    - Go to [dashboard.render.com](https://dashboard.render.com).
    - Click **New +** -> **Web Service**.
    - Connect your GitHub repository.

3.  **Settings:**
    - **Runtime:** Node
    - **Build Command:** `cd backend && npm install`
    - **Start Command:** `node backend/server.js`
    - **Environment Variables:** Add `OPENAI_API_KEY` and `ADMIN_TOKEN`.

4.  **Deploy:**
    - Click **Create Web Service**. Render will build and deploy your app. You will get a `onrender.com` URL.

## Option 3: Vercel

Vercel is great for static sites, but this app uses a custom Express backend. You can deploy it using `vercel.json` configuration to treat the Express app as a Serverless Function, but **Render is recommended** for this specific architecture.

If you must use Vercel:
1. Create a `vercel.json` in the root:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "backend/server.js",
         "use": "@vercel/node"
       },
       {
         "src": "frontend/**",
         "use": "@vercel/static"
       }
     ],
     "routes": [
       { "src": "/api/(.*)", "dest": "/backend/server.js" },
       { "src": "/(.*)", "dest": "/frontend/$1" }
     ]
   }
   ```
2. Deploy using Vercel CLI or Git integration.

## GitHub Actions (Deploy to Render Hook)

You can automate deployment to Render using a Deploy Hook.

1. In Render Dashboard, go to Settings -> **Deploy Hook**. Copy the URL.
2. In GitHub Repo, go to Settings -> Secrets -> Actions. Add `RENDER_DEPLOY_HOOK_URL`.
3. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Render

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render Deploy
        run: curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
```
