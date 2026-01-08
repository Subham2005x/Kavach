# Deployment Guide - Kavach (Google Cloud Free Tier)

## Prerequisites
- Google Cloud Platform account (free tier, credit card may be required for verification but won't be charged)
- Firebase account (use same Google account)
- GitHub account (free)

**Note**: Google Cloud offers $300 free credits for 90 days + Always Free tier services.

---

## Part 1: GCP Setup (One-Time)

### 1. Create Google Cloud Project
1. Go to https://console.cloud.google.com
2. Create new project: "Kavach"
3. Note your PROJECT_ID

### 2. Enable Required APIs (Free)
```bash
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 3. Create Artifact Registry Repository (Free)
```bash
gcloud artifacts repositories create kavach \
  --repository-format=docker \
  --location=asia-south1 \
  --description="Kavach Docker images"
```
---

## Part 2: Deploy Backend to Cloud Run (Free Tier)

### Option A: Deploy via Google Cloud Console (No CLI needed)

#### 1. Prepare Code
Push your code to GitHub first.

#### 2. Deploy from Source
1. Go to https://console.cloud.google.com/run
2. Click "Create Service"
3. Select "Continuously deploy from a repository (Cloud Build)"
4. Click "Set up with Cloud Build"
5. Connect GitHub repository
6. Select your repo and branch `main`
7. Build Configuration:
   - **Build Type**: Dockerfile
   - **Source location**: `/backend/Dockerfile`
8. Service Settings:
   - **Region**: asia-south1 (Mumbai)
   - **CPU allocation**: CPU is only allocated during request processing (saves money)
   - **Autoscaling**: Min 0, Max 10
   - **Memory**: 512 MiB
   - **CPU**: 1
9. Add Environment Variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your API key
10. Authentication: Allow unauthenticated invocations
11. Click "Create"

#### 3. Get Backend URL
After deployment, copy the URL (e.g., `https://kavach-backend-xxx.asia-south1.run.app`)

### Option B: Deploy via Command Line

```bash
cd backend

# Build and deploy in one command
gcloud run deploy kavach-backend \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your-key-here \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10

# Get URL
gcloud run services describe kavach-backend \
  --region asia-south1 \
  --format 'value(status.url)'
```

**Free Tier Limits (Always Free):**
- ✅ 2 million requests per month
- ✅ 360,000 GB-seconds of memory
- ✅ 180,000 vCPU-seconds
- ✅ 1 GB network egress per month
- ✅ This is MORE than enough for your hackathon!

---

## Part 3: Deploy Frontend to Firebase Hosting (Free)
## Part 3: Deploy Frontend to Firebase Hosting (Free)

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Firebase (in frontend folder)
```bash
cd frontend
firebase init hosting
```

**Select:**
- Use existing project or create new (use same GCP project)
- Public directory: `dist`
- Single-page app: `Yes`
- GitHub Actions: `Yes` (for auto-deploy)

### 4. Update Environment Variable
Create `frontend/.env.production`:
```env
VITE_API_URL=https://kavach-backend-xxx.asia-south1.run.app
```
(Use your actual Cloud Run URL)

### 5. Build and Deploy
```bash
npm run build
firebase deploy --only hosting
```

Your app will be live at: `https://your-project.web.app`

### 1. Create Service Account for GitHub
```bash
# Create service account
gcloud iam service-accounts create github-deployer \
  --display-name="GitHub Actions Deployer"

# Get your project ID
PROJECT_ID=$(gcloud config get-value project)

# Grant Cloud Run Admin role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# Grant Service Account User role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Grant Artifact Registry Writer
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Create key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-deployer@$PROJECT_ID.iam.gserviceaccount.com
```

### 2. Add GitHub Secrets
Go to your GitHub repo → Settings → Secrets and variables → Actions

Add these secrets:
- **GCP_PROJECT_ID**: Your GCP project ID
- **GCP_SA_KEY**: Content of `key.json` file (paste entire JSON)
- **GEMINI_API_KEY**: Your Gemini API key
- **FIREBASE_SERVICE_ACCOUNT**: Firebase service account JSON (from Firebase console)

### 3. Workflows are Already Created!
The `.github/workflows/` files are already set up. Just push to GitHub:

```bash
git add .
git commit -m "Deploy to Google Cloud"
git push origin main
```

GitHub Actions will automatically:
- Build and deploy backend to Cloud Run
- Build and deploy frontend to Firebase Hosting

---

## Part 5: Update Backend CORS

After getting your Firebaseend Vercel URL

**Free Tier Limits:**
- 100 GB bandwidth/month
- Serverless function executions included
- Custom domains
- Automatic HTTPS

---

## Part 4: Update Backend CORS

After getting your frontend URL, update `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-project.web.app",
        "https://your-project.firebaseapp.com",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Troubleshooting

### Cloud Run Issues:
```bash
# View logs
gcloud run services logs read kavach-backend --region asia-south1

# Check service details
gcloud run services describe kavach-backend --region asia-south1
```

### Firebase Issues:
```bash
# View deployment history
firebase hosting:channel:list

# Check site details
firebase hosting:sites:list
```

### GitHub Actions Issues:
- Check Actions tab for error logs
- Verify all secrets are set correctly
- Ensure service account has proper permissions

---

## Cost Optimization

### Cloud Run:
- Free tier: 2 million requests/month
- Set `--max-instances 10` to limit costs
- Use `--cpu 1 --memory 512Mi` for optimization

### Firebase Hosting:
- Free tier: 10 GB storage, 360 MB/day transfer
- Upgrade to Blaze plan only if needed           # Your Firebase URL
        "https://your-project.firebaseapp.com",   # Alternative Firebase URL
        "http://localhost:5173",                   # Local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then redeploy backend with updated CORS.

---

## Monitoring & Troubleshooting

### View Cloud Run Logs
```bash
gcloud run services logs read kavach-backend \
  --region asia-south1 \
  --limit 100
```

### View Firebase Hosting Status
```bash
firebase hosting:channel:list
```

### Check Cloud Run Service
```bash
gcloud run services describe kavach-backend --region asia-south1
```

### Update Environment Variable
```bash
gcloud run services update kavach-backend \
  --update-env-vars GEMINI_API_KEY=new-key \
  --region asia-south1
```

---

## Cost Breakdown (FREE! 🎉)

### Google Cloud Run (Always Free Tier):
- ✅ 2 million requests/month - FREE
- ✅ 360,000 GB-seconds memory - FREE  
- ✅ 180,000 vCPU-seconds compute - FREE
- ✅ Your hackathon usage: **<1% of limits**

### Firebase Hosting (Spark Plan - Free):
- ✅ 10 GB storage - FREE
- ✅ 360 MB/day bandwidth - FREE
- ✅ SSL certificate - FREE
- ✅ Global CDN - FREE

### Artifact Registry (Free Tier):
- ✅ 0.5 GB storage - FREE
- ✅ Your Docker images: **~100 MB**

### Total Monthly Cost: **$0** 💰

---

## Performance Optimization (Free Tier)

### 1. Cloud Run Auto-Scaling
Already configured with:
- Min instances: 0 (no idle costs)
- Max instances: 10
- CPU allocated only during requests

### 2. Firebase CDN
Automatically enabled - your static files served from edge locations worldwide.

### 3. Caching Strategy
Backend has built-in caching for AI responses (30 min TTL).

---

## Quick Commands Cheat Sheet

### Backend Commands:
```bash
# Deploy backend
cd backend && gcloud run deploy kavach-backend --source .

# View logs
gcloud run services logs read kavach-backend --region asia-south1

# Update env var
gcloud run services update kavach-backend --update-env-vars KEY=value
```

### Frontend Commands:
```bash
# Build and deploy
cd frontend && npm run build && firebase deploy

# Preview channel
firebase hosting:channel:deploy preview

# View hosting info
firebase hosting:sites:get
```

### Cleanup (if needed):
```bash
# Delete Cloud Run service
gcloud run services delete kavach-backend --region asia-south1

# Delete Firebase hosting
firebase hosting:disable
```

---