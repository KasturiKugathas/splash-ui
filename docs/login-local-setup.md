# GitHub OAuth Login Setup

Splash-UI local login uses a GitHub OAuth App and a server-side session cookie.

## 1. Create a GitHub OAuth App

Create an OAuth App in GitHub with:

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:8000/auth/github/callback`

## 2. Export local environment variables

Start the API with:

```bash
export GITHUB_OAUTH_CLIENT_ID=your_github_oauth_app_client_id
export GITHUB_OAUTH_CLIENT_SECRET=your_github_oauth_app_client_secret
export SPLASH_UI_SESSION_SECRET=replace_with_a_long_random_string
export SPLASH_UI_API_BASE_URL=http://localhost:8000
export SPLASH_UI_WEB_BASE_URL=http://localhost:3000
uvicorn app.main:app --reload
```

Start the web app with:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

## 3. Local host requirement

Use `localhost` for both the web app and API.

Do not mix `localhost` and `127.0.0.1` during login testing. Cookies are domain-based, and switching hostnames will make the session look inconsistent.

## 4. Expected flow

1. Open `http://localhost:3000/login`
2. Click `Continue with GitHub`
3. Complete the GitHub consent screen
4. Return to Splash-UI at `/app`
5. Open `/app/repositories` and confirm the repository list loads from your signed-in GitHub account
