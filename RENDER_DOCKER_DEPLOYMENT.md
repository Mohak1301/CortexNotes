# 🚀 Render Deployment Guide: Docker Qdrant + Backend

## 📋 Overview
This guide deploys both services on Render:
- **Qdrant Vector Database** (Docker container)
- **Backend API** (Node.js)

## 🔧 Prerequisites
- GitHub repository with your code
- Render account (free)
- MongoDB Atlas account (free)
- OpenAI API key

## 🐳 Step-by-Step Deployment

### Step 1: Prepare Your Repository
Ensure your repository structure:
```
CortexNotes/
├── backend/
│   ├── render.yaml          # Render configuration
│   ├── Dockerfile.qdrant    # Qdrant Dockerfile
│   ├── docker-compose.yml   # Local development
│   ├── server.js           # Backend server
│   └── package.json        # Backend dependencies
└── frontend/               # React app (deploy separately)
```

### Step 2: Deploy Using Blueprint (Recommended)

1. **Push your code to GitHub**
2. **Go to Render Dashboard**
3. **Click "New +" → "Blueprint"**
4. **Connect your GitHub repository**
5. **Render will detect `render.yaml`**
6. **Configure environment variables** (see below)
7. **Click "Apply"**

### Step 3: Configure Environment Variables

In the Render dashboard, add these variables for the **backend service**:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cortexnotes?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your-super-secret-jwt-access-key-here-make-it-long-and-random
JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-key-here-make-it-long-and-random
OPENAI_API_KEY=sk-your-openai-api-key-here
FRONTEND_URL=https://your-frontend-domain.vercel.app
NODE_ENV=production
```

**Note**: QDRANT_URL is automatically set to `https://cortexnotes-qdrant.onrender.com`

### Step 4: Wait for Deployment

1. **Qdrant service** will deploy first (2-5 minutes)
2. **Backend service** will deploy second (2-5 minutes)
3. **Both services** will be available at:
   - Qdrant: `https://cortexnotes-qdrant.onrender.com`
   - Backend: `https://cortexnotes-backend.onrender.com`

## 🔧 Alternative: Manual Deployment

### Deploy Qdrant First

1. **Go to Render → New → Web Service**
2. **Connect GitHub repository**
3. **Configure:**
   - **Name**: `cortexnotes-qdrant`
   - **Environment**: `Docker`
   - **Root Directory**: `backend`
   - **Dockerfile Path**: `Dockerfile.qdrant`
4. **Deploy**

### Deploy Backend Second

1. **Go to Render → New → Web Service**
2. **Connect same GitHub repository**
3. **Configure:**
   - **Name**: `cortexnotes-backend`
   - **Environment**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. **Add environment variables** (see Step 3 above)
5. **Set QDRANT_URL** to your Qdrant service URL
6. **Deploy**

## 🔑 Environment Variables Guide

### Generate JWT Secrets
```bash
# Generate JWT Access Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT Refresh Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### MongoDB Atlas Setup
1. **Create cluster** in MongoDB Atlas
2. **Get connection string**
3. **Replace `<password>`** with your actual password
4. **Add to environment variables**

### OpenAI API Key
1. **Go to OpenAI Platform**
2. **Create new API key**
3. **Copy key** (starts with `sk-`)
4. **Add to environment variables**

## 🔍 Service URLs

After deployment, your services will be available at:

- **Qdrant**: `https://cortexnotes-qdrant.onrender.com`
- **Backend**: `https://cortexnotes-backend.onrender.com`

## 🔧 Testing Your Deployment

### Test Qdrant
```bash
curl https://cortexnotes-qdrant.onrender.com/collections
```

### Test Backend
```bash
curl https://cortexnotes-backend.onrender.com/api/auth/profile
```

## 🔍 Troubleshooting

### Issue 1: Qdrant Service Won't Start
**Solution:**
- Check Dockerfile.qdrant exists
- Verify Qdrant image is accessible
- Check service logs in Render dashboard

### Issue 2: Backend Can't Connect to Qdrant
**Solution:**
- Verify QDRANT_URL is correct
- Check if Qdrant service is running
- Test Qdrant URL directly

### Issue 3: Environment Variables Not Working
**Solution:**
- Redeploy after adding variables
- Check variable names match exactly
- Ensure no extra spaces

### Issue 4: Free Tier Limits
**Solution:**
- Services sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- Consider upgrading for production use

## 📊 Render Free Tier Limits

### Per Service:
- **750 hours/month** (enough for 24/7)
- **512MB RAM**
- **Shared CPU**
- **Automatic sleep** after 15 minutes

### Total:
- **Multiple services** allowed
- **Custom domains** supported
- **SSL certificates** automatic

## 🔄 Auto-Deploy Features

Render automatically:
- **Deploys on git push** to main branch
- **Runs health checks**
- **Provides real-time logs**
- **Handles SSL certificates**
- **Manages environment variables**

## 🚨 Important Notes

1. **Deploy Qdrant first**, then backend
2. **Free tier sleeps** after 15 minutes
3. **Environment variables** are encrypted
4. **Logs** available in dashboard
5. **Custom domains** supported



---

**🎉 Your Docker Qdrant + Backend are now deployed on Render!**
