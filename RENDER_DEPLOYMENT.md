# 🚀 Render Deployment Guide for CortexNotes Backend

## 📋 Prerequisites
- GitHub repository with your code
- Render account (free)
- MongoDB Atlas account (free)
- Qdrant hosted somewhere (Railway/Render/Fly.io)

## 🔧 Step-by-Step Render Deployment

### Step 1: Create Render Account
1. Go to [Render](https://render.com/)
2. Sign up with GitHub
3. Verify your email

### Step 2: Deploy Backend Service
1. **Click "New +"** in Render dashboard
2. **Select "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**

   **Basic Settings:**
   - **Name**: `cortexnotes-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 3: Configure Environment Variables
Click on "Environment" tab and add these variables:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cortexnotes?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your-super-secret-jwt-access-key-here-make-it-long-and-random
JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-key-here-make-it-long-and-random
OPENAI_API_KEY=sk-your-openai-api-key-here
FRONTEND_URL=https://your-frontend-domain.vercel.app
QDRANT_URL=https://your-qdrant-domain.railway.app
```

### Step 4: Deploy
1. **Click "Create Web Service"**
2. **Wait for deployment** (usually 2-5 minutes)
3. **Copy your service URL** (e.g., `https://cortexnotes-backend.onrender.com`)

## 🔧 Alternative: Using render.yaml (Recommended)

### Step 1: Use the render.yaml file
1. **Push your code** with the `render.yaml` file
2. **Go to Render dashboard**
3. **Click "New +" → "Blueprint"**
4. **Connect your GitHub repository**
5. **Render will automatically detect** the `render.yaml` file
6. **Configure environment variables** (the ones marked `sync: false`)
7. **Deploy**

## 🔑 Environment Variables Setup

### Required Variables:
1. **MONGODB_URI**: Your MongoDB Atlas connection string
2. **JWT_ACCESS_SECRET**: Generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
3. **JWT_REFRESH_SECRET**: Generate another secure secret
4. **OPENAI_API_KEY**: Your OpenAI API key
5. **FRONTEND_URL**: Your Vercel frontend URL
6. **QDRANT_URL**: Your hosted Qdrant URL

### Optional Variables:
- **NODE_ENV**: Set to `production`
- **PORT**: Render sets this automatically

## 🔍 Troubleshooting

### Issue 1: Build Fails
**Solution:**
- Check if `package.json` has correct start script
- Verify all dependencies are in `package.json`
- Check build logs in Render dashboard

### Issue 2: Service Won't Start
**Solution:**
- Check start command: `npm start`
- Verify `server.js` exists
- Check environment variables are set

### Issue 3: Port Issues
**Solution:**
- Render automatically sets PORT environment variable
- Your code should use `process.env.PORT || 10000`

### Issue 4: Environment Variables Not Working
**Solution:**
- Redeploy after adding variables
- Check variable names match exactly
- Ensure no extra spaces

## 📊 Render Free Tier Limits

- **750 hours/month** (enough for 24/7 uptime)
- **512MB RAM**
- **Shared CPU**
- **Automatic sleep** after 15 minutes of inactivity
- **Custom domains** supported

## 🔄 Auto-Deploy

Render automatically:
- **Deploys on git push** to main branch
- **Runs health checks**
- **Provides logs** in real-time
- **Handles SSL certificates**

## 🚨 Important Notes

1. **Free tier sleeps** after 15 minutes of inactivity
2. **First request** after sleep takes 30-60 seconds
3. **Environment variables** are encrypted
4. **Logs** are available in dashboard
5. **Custom domains** are supported

## 🔗 Next Steps

After successful deployment:

1. **Test your API endpoints**
2. **Update frontend** with new backend URL
3. **Configure custom domain** (optional)
4. **Set up monitoring** and alerts
5. **Deploy frontend** to Vercel

## 📞 Support

- **Render Documentation**: https://render.com/docs
- **Community Forum**: https://community.render.com
- **Status Page**: https://status.render.com

---

**🎉 Your backend is now deployed on Render!**
