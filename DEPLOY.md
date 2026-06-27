# 部署指南 (Vercel + Render 免费方案)

## 步骤 1：推送到 GitHub

```bash
cd ~/newslearn-app
git add .
git commit -m "Deploy: Vercel + Render"
git push origin main
```

## 步骤 2：部署后端 (Render)

1. 打开 https://render.com 注册/登录
2. 点击 **New +** → **Web Service**
3. 连接你的 GitHub 仓库 `jinggrace90-bit/NewsLearn`
4. 配置：
   - **Name**: `newslearn-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
5. 点击 **Create Web Service**
6. 等待部署完成，复制 Render 给的 URL（如 `https://newslearn-backend.onrender.com`）

## 步骤 3：部署前端 (Vercel)

1. 打开 https://vercel.com 注册/登录
2. 点击 **Add New Project** → **Import Git Repository**
3. 选择 `jinggrace90-bit/NewsLearn`
4. 配置环境变量：
   - **Key**: `BACKEND_URL`
   - **Value**: `https://newslearn-backend.onrender.com`（步骤2复制的URL）
5. 点击 **Deploy**
6. 部署完成后点击 **Visit** 打开你的网站

## 完成！

- 前端：`https://newslearn.vercel.app`
- 后端：`https://newslearn-backend.onrender.com`

## 注意

- Render 免费版有冷启动（首次访问等 30-60 秒）
- 后端每次访问会自动从 RSS 抓取新闻并缓存到 SQLite
