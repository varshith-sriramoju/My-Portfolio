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
```

### What do these service-enabling commands do (and do you need them)?
- appengine.googleapis.com: Enables the App Engine API so your project can host and manage App Engine apps.
- cloudbuild.googleapis.com: Enables Cloud Build, which App Engine uses behind the scenes to build/package your app during deploys.
- storage.googleapis.com: Enables Cloud Storage features used for staging build artifacts (and any other GCS usage).

Notes:
- These are safe to run multiple times; if a service is already enabled, the command is a no-op.
- In some projects, creating the App Engine app may auto-enable appengine.googleapis.com; still, enabling explicitly avoids surprises.
- If you encountered the “staging bucket access” error, the APIs likely were enabled but IAM needed adjusting (see the fix section below).

```powershell
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

## 2.1) App Engine env variables (for contact form)
Set your Web3Forms UUID so the contact form can submit:
```powershell
# Option A: edit app.yaml
# In app.yaml, set:
# env_variables:
#   WEB3FORMS_ACCESS_KEY: "8c2f0a2e-1234-4e9a-9abc-5f67d8901234"

# Option B: deploy-time override (Cloud Build reads app.yaml by default, but you can override in some flows)
# Typically for App Engine standard, set in app.yaml.
```

Deploy steps (recap):
```powershell
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud app create --region=us-central

gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable storage.googleapis.com

# Build locally (optional)
.\mvnw.cmd clean package -DskipTests

# Deploy (App Engine will use app.yaml)
gcloud app deploy

# Open the app
gcloud app browse
```

Verify the contact key is present:
- In the contact page source, confirm the hidden input has your UUID.
- If empty, set WEB3FORMS_ACCESS_KEY in app.yaml and redeploy.

Troubleshooting:
- If you see the staging bucket error, grant Storage access to the App Engine default SA as shown earlier.
- If contact submission still fails, double-check the UUID has no spaces and matches Web3Forms dashboard.

## 2.2) Do I need a .env file?
Short answer: No.
- Spring Boot reads `application.properties`/`application.yml` and environment variables automatically; it does not load `.env` by default.
- On App Engine Standard (Java), set env vars in `app.yaml` under `env_variables:`.
- For production secrets, prefer Google Secret Manager (and inject via App Engine or Cloud Run) over committing them to source.

Examples:
- App Engine (`app.yaml`):
```
runtime: java17
# ...
env_variables:
  WEB3FORMS_ACCESS_KEY: "paste-your-uuid-here"
```
- Spring config (`application.properties`):
```
web3forms.access_key=${WEB3FORMS_ACCESS_KEY:}
```
- Local dev (Windows PowerShell) without hardcoding:
```powershell
$env:WEB3FORMS_ACCESS_KEY="paste-your-uuid-here"
.\mvnw.cmd spring-boot:run
```

If you truly want `.env` support, you’d add a library and custom bootstrap to load it, but it’s not necessary and adds complexity. Stick to `app.yaml` for App Engine and environment variables/Secret Manager for production.

## 2.3) Web3Forms setup (Send Message)
To enable the Contact form, you must set your Web3Forms Access Key (UUID v4):

- Get your key from https://web3forms.com/ (Dashboard → Access Key)
- Local dev (PowerShell):
```powershell
$env:WEB3FORMS_ACCESS_KEY="paste-your-uuid-here"
.\mvnw.cmd spring-boot:run
```
- App Engine (`app.yaml`):
```yaml
runtime: java17
# ...
env_variables:
  WEB3FORMS_ACCESS_KEY: "paste-your-uuid-here"
```
- Spring config (`application.properties`) already reads the env var:
```
web3forms.access_key=${WEB3FORMS_ACCESS_KEY:}
```
- The contact template injects the key into the form automatically:
```
th:value="${@environment.getProperty('web3forms.access_key')}"
```
- Client-side validation will block submission if the key is missing/invalid.

Verify:
- View page source on the Contact page and ensure the hidden input value is your UUID (no spaces).
- Submit a test message; Web3Forms should accept it if the key is valid.

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
- To check which services are enabled in your project: `gcloud services list --enabled`.

That’s it—run, deploy, and update with the commands above. If you hit an error, copy the exact message and rerun the fix steps in the staging bucket section, or check logs.
