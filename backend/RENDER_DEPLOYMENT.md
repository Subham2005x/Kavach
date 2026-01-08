# Deploy Backend to Render (Free Tier)

## Prerequisites
- GitHub account
- Render account (sign up at https://render.com)
- Your GEMINI_API_KEY

## Step-by-Step Deployment Instructions

### 1. Push Your Code to GitHub

First, initialize a Git repository in your backend folder (if not already done):

```bash
cd C:\Users\SUBHAM NABIK\Desktop\Hackathon\Kavach\backend
git init
git add .
git commit -m "Initial backend commit for Render deployment"
```

Create a new repository on GitHub and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/kavach-backend.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Render

1. **Go to Render Dashboard**: https://dashboard.render.com/

2. **Create New Web Service**:
   - Click "New +" button → Select "Web Service"
   - Choose "Build and deploy from a Git repository"
   - Click "Next"

3. **Connect Your Repository**:
   - Connect your GitHub account if not already connected
   - Select your `kavach-backend` repository
   - Click "Connect"

4. **Configure the Web Service**:
   - **Name**: `kavach-backend` (or any name you prefer)
   - **Region**: Oregon (US West) - closest free tier region
   - **Branch**: `main`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free

5. **Add Environment Variables**:
   - Scroll down to "Environment Variables" section
   - Click "Add Environment Variable"
   - Add the following:
     - **Key**: `GEMINI_API_KEY`
     - **Value**: Your actual Gemini API key
   - Click "Add Environment Variable" again for any other keys you need

6. **Create Web Service**:
   - Click "Create Web Service" button at the bottom
   - Render will start building and deploying your app
   - This takes 2-5 minutes

7. **Get Your Backend URL**:
   - Once deployed, you'll see a URL like: `https://kavach-backend-XXXX.onrender.com`
   - Copy this URL

### 3. Update Frontend to Use Render Backend

Update your frontend `.env` file:

```env
VITE_API_URL=https://kavach-backend-XXXX.onrender.com
```

Replace `XXXX` with your actual Render service URL.

### 4. Redeploy Frontend

```bash
cd C:\Users\SUBHAM NABIK\Desktop\Hackathon\Kavach\frontend
firebase deploy
```

## Important Notes

### Free Tier Limitations
- **Spins down after 15 minutes of inactivity** - First request after inactivity will be slow (cold start ~30 seconds)
- **750 hours/month** - Enough for constant uptime
- **512 MB RAM** - Should be sufficient for your FastAPI app
- **No custom domains** on free tier

### Keeping Service Warm (Optional)
To avoid cold starts, you can use a free service like UptimeRobot or Cron-job.org to ping your backend every 10 minutes:

1. Go to https://uptimerobot.com (or https://cron-job.org)
2. Create a monitor for: `https://your-backend.onrender.com/`
3. Set interval to 5-10 minutes

### Troubleshooting

**Build Fails**:
- Check build logs in Render dashboard
- Ensure all dependencies are in `requirements.txt`
- Check Python version compatibility

**App Crashes**:
- Check logs in Render dashboard (Logs tab)
- Verify environment variables are set correctly
- Ensure PORT is not hardcoded (use `$PORT` in start command)

**CORS Errors**:
- The backend already includes `"*"` in CORS origins for testing
- For production, update the CORS origins in `main.py` to only include your Firebase URL

### Health Check

Once deployed, test your backend:

```bash
curl https://your-backend.onrender.com/
```

You should get a response from your FastAPI app.

## Alternative: Using render.yaml (Blueprint)

If you prefer Infrastructure as Code, Render can auto-deploy using the `render.yaml` file already created:

1. Go to Render Dashboard
2. Click "New +" → "Blueprint"
3. Connect your repository
4. Render will detect `render.yaml` and configure everything automatically
5. Just add your `GEMINI_API_KEY` in the environment variables

## Monitoring

- **Logs**: Available in Render dashboard under "Logs" tab
- **Metrics**: Basic metrics available in "Metrics" tab
- **Events**: Deployment history in "Events" tab

## When Moving to GCP

When you're ready to move to GCP:
1. Update `VITE_API_URL` in frontend `.env` to GCP URL
2. Redeploy frontend: `firebase deploy`
3. You can keep Render as backup or delete the service

---

**Your backend will be live at**: `https://kavach-backend-XXXX.onrender.com`

Remember to update the frontend environment variable with this URL!
