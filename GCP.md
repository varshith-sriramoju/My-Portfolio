# Google Cloud Deployment Guide (Spring Boot, Maven) — App Engine

This guide walks you through deploying this project to Google Cloud using Cloud Run or App Engine without writing a Dockerfile. It includes prerequisites, commands, CI/CD, troubleshooting (including the bucket permission error you saw), and tips you can reuse for future projects.

## Prerequisites
- Google Cloud project created (note your PROJECT_ID)
- Billing enabled
- Install Google Cloud SDK (gcloud CLI)
- Java 17+ and Maven installed locally
- Source code pushed to a Git repo (optional but recommended)

## 1) Authenticate and set project
```bash
# Login and select project
gcloud auth login

# Set the project
gcloud config set project <PROJECT_ID>

# Set default region (example: asia-south1, us-central1)
gcloud config set run/region <REGION>
```

## 2) Enable required APIs
```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  appengine.googleapis.com \
  secretmanager.googleapis.com
```

## 3) Build the app locally
```bash
# From the project root (where pom.xml is)
mvn -DskipTests clean package

# Do not commit target/ to Git; keep it in .gitignore
```

## 4) Option A — Deploy to Cloud Run WITHOUT Docker (buildpacks)
Cloud Run can build and deploy your app directly from source using buildpacks.

### A.1 One-command build and deploy from source
```bash
# Deploy from source; Cloud Build will containerize via buildpacks
gcloud run deploy my-portfolio \
  --source . \
  --region <REGION> \
  --allow-unauthenticated \
  --port 8080
```
Notes:
- Spring Boot defaults to 8080; ensure `server.port=8080` or remove any custom ports.
- After deploy, gcloud prints a service URL; open it to verify.

### A.2 Environment variables (if needed)
```bash
gcloud run services update my-portfolio \
  --set-env-vars SPRING_PROFILES_ACTIVE=prod,MY_KEY=VALUE
```

### A.3 Recommended health endpoints
Add Spring Actuator to expose `/actuator/health` for liveness and readiness.
In `pom.xml`, include:
```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

## 5) Option B — Deploy to App Engine Standard (Java) WITHOUT Docker
Use App Engine’s Java runtime to deploy your JAR.

### B.1 Create app.yaml
Create `app.yaml` in the project root:
```yaml
runtime: java17
instance_class: F2
env_variables:
  SPRING_PROFILES_ACTIVE: "prod"
```

### B.2 Deploy
```bash
# Initialize App Engine in your region (only once)
gcloud app create --region=<REGION>

# Deploy the app
gcloud app deploy

# Browse the app
gcloud app browse
```

## 6) Fix for bucket permission error during App Engine deploy
Error you saw:
```
invalid bucket "staging.<PROJECT_ID>.appspot.com"; service account <PROJECT_ID>@appspot.gserviceaccount.com does not have access to the bucket
```
This happens when the App Engine default service account lacks storage permissions.

### Fix steps
```bash
# Grant the App Engine default SA storage perms
gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member "serviceAccount:<PROJECT_ID>@appspot.gserviceaccount.com" \
  --role "roles/storage.admin"

# (Optional, tighter) roles/storage.objectAdmin may be enough:
# --role "roles/storage.objectAdmin"

# Retry deploy
gcloud app deploy
```
If the staging bucket doesn’t exist or is misconfigured, recreate the App Engine application:
```bash
# Only if creation failed earlier
gcloud app create --region=<REGION>
```

## 7) Routing, controllers, and avoiding 404 Whitelabel
- Ensure you have a controller mapping for `/` and key paths (e.g., `/resume`) to avoid the fallback 404.
- Place templates under `src/main/resources/templates/` and static files under `src/main/resources/static/`.
- For PDFs, serve them via a controller with proper headers or place them in `src/main/resources/static/resume/` and link to `/resume/VarshithResume.pdf`.

Example Resume controller:
```java
@GetMapping("/resume")
public ResponseEntity<Resource> getResume() throws IOException {
    ClassPathResource pdf = new ClassPathResource("resume/VarshithResume.pdf");
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_PDF);
    headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=VarshithResume.pdf");
    return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
}
```
This serves inline for desktop and mobile browsers.

## 8) Domain, HTTPS, and networking
- Cloud Run: map a custom domain in the console; managed SSL is automatic.
- App Engine: set custom domain and SSL; use `gcloud app domain-mappings` if needed.
- If calling private services, configure VPC connectors for Cloud Run.

## 9) Logs, metrics, errors
- Logs: view in Cloud Logging → `run.googleapis.com` (Cloud Run) or `appengine.googleapis.com` (App Engine).
- Metrics & alerts: use Cloud Monitoring; alert on latency, 5xx, CPU/memory.
- Error Reporting captures uncaught exceptions; add structured logging where possible.

## 10) CI/CD (optional, GitHub Actions)
Minimal pipeline to build and deploy to Cloud Run (no Dockerfile):
```yaml
name: Deploy to Cloud Run
on:
  push:
    branches: [ "main" ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - name: Build
        run: mvn -DskipTests clean package
      - name: Auth to GCP
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - name: Set Project
        run: gcloud config set project ${{ secrets.GCP_PROJECT_ID }}
      - name: Deploy (buildpacks)
        run: gcloud run deploy my-portfolio --source . --region ${{ secrets.GCP_REGION }} --allow-unauthenticated --port 8080
```
Create a service account with roles: Cloud Run Admin, Cloud Build Editor, Service Account User.

## 11) Performance and cost tips
- Cloud Run: set min instances to 0–1 to balance cold starts vs cost.
- Concurrency: start with 80–100; reduce if your app is CPU-bound.
- App Engine: pick instance class (F1/F2/F4) based on load; autoscaling defaults are fine for most apps.

## 12) Quick verification checklist
- APIs enabled
- `gcloud config set project <PROJECT_ID>`
- Build succeeds: `mvn clean package`
- Deploy:
  - Cloud Run: `gcloud run deploy --source . --allow-unauthenticated`
  - App Engine: `gcloud app deploy`
- Root route (`/`) and key pages respond (no Whitelabel 404)
- Logs show healthy startup; no crash loops

## 13) Common issues & fixes
- 404 Whitelabel: missing controller or wrong template/static path.
- 403/permission: grant roles to the service account; verify project is correct.
- Build failure on Cloud Build: check Java version (use Java 17), lock Maven plugins, and ensure no interactive prompts.
- Static assets missing: verify paths under `src/main/resources/static/` and link them with leading `/`.

## 14) What not to commit
- `target/` build outputs
- Secrets (use Secret Manager)
- `.DS_Store`, IDE metadata; maintain a clean `.gitignore`

---
With this guide, you can repeat a no‑Docker deployment via Cloud Run or App Engine quickly. For most stateless Spring Boot apps, Cloud Run with buildpacks (`gcloud run deploy --source .`) is the fastest, simplest path.

