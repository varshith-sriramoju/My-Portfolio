# My Portfolio – Quick Help

A simple guide to run locally and deploy to Google Cloud App Engine (no Docker).

## 1) Run locally (Windows PowerShell)
```powershell
# From project root
.\mvnw.cmd clean package -DskipTests
.\mvnw.cmd spring-boot:run
# Or run the built JAR
java -jar .\target\My-Portfolio-0.0.1-SNAPSHOT.jar
# Open http://localhost:8080
```

## 2) Deploy to Google App Engine (no Docker)
Prereqs: Google Cloud CLI installed; Java 11/17; a GCP project ID.
```powershell
# Log in and set your project
gcloud init
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID

# One-time: create App Engine app (pick region)
gcloud app create --region=us-central

# Ensure required services
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable storage.googleapis.com

# Build and deploy
.\mvnw.cmd clean package -DskipTests
gcloud app deploy .\target\My-Portfolio-0.0.1-SNAPSHOT.jar

# Open your app
gcloud app browse
```

### If deploy fails with a staging bucket error
Use one of the fixes:
```powershell
# Grant Storage Admin to App Engine default service account (simple)
gcloud projects add-iam-policy-binding YOUR_GCP_PROJECT_ID `
  --member="serviceAccount:YOUR_GCP_PROJECT_ID@appspot.gserviceaccount.com" `
  --role="roles/storage.admin"

# Or create your own staging bucket and use it
$bucket="YOUR-UNIQUE-STAGING-BUCKET" 
gsutil mb -l us-central1 gs://$bucket
gsutil iam ch serviceAccount:YOUR_GCP_PROJECT_ID@appspot.gserviceaccount.com:roles/storage.objectAdmin gs://$bucket
gcloud app deploy .\target\My-Portfolio-0.0.1-SNAPSHOT.jar --bucket=$bucket
```

## 3) Update content and redeploy
Edit files, then rebuild and deploy.
- Templates: `src/main/resources/templates/` (e.g., `home.html`, fragments)
- Static: `src/main/resources/static/` (CSS: `static/css/`, images: `static/images/`, JS: `static/js/`)
- Resume PDF: `src/main/resources/resume/VarshithResume.pdf`
```powershell
.\mvnw.cmd clean package -DskipTests
gcloud app deploy .\target\My-Portfolio-0.0.1-SNAPSHOT.jar
```
Tip: Hard refresh (Ctrl+F5) if CSS/JS seem unchanged.

## 4) Useful commands
```powershell
# View logs
gcloud app logs tail -s default
# List versions
gcloud app versions list
# Route traffic to a version
gcloud app services set-traffic default --splits VERSION_ID=1
```

## 5) Notes
- Port: default 8080 locally. No need to set `server.port` on App Engine.
- Error pages: custom templates are used instead of Whitelabel when routes are missing.
- Custom domain: App Engine → Settings → Custom Domains (HTTPS auto-provisioned).

That’s it—run, deploy, and update with the commands above. If you hit an error, copy the exact message and rerun the fix steps in the staging bucket section, or check logs.
