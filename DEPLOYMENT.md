# Deployment

## Hosting choice

The backend is a Node.js/Express API and should be deployed to Render or Railway. The frontend is a Vite static application and should be deployed to Netlify or Vercel.

## Backend environment

Required variables:

- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: private random signing secret
- `FRONTEND_ORIGINS`: comma-separated exact frontend origins
- `LOAN_DAYS`: loan period in days (default `14`)
- `FINE_PER_DAY`: fine amount per late calendar day (default `0.25`)
- `PORT`: platform-provided or `3000`

Set `FRONTEND_ORIGINS` to the deployed frontend origin, not `localhost`, and keep credentials enabled in CORS.

## Frontend environment

Set `VITE_API_BASE_URL` to the deployed HTTPS backend origin. Do not retain `http://localhost:3000` in production. Rebuild after changing this value.

Configure SPA fallback to `/index.html` so direct `/books/:id` and `/admin/*` routes work.

## Real deployment issue

A production build may be generated successfully while still calling the local backend if the deployment environment does not receive `VITE_API_BASE_URL`. I resolved this by setting the variable explicitly in the frontend host's build environment and triggering a fresh build; Vite embeds its value at build time, so editing the host variable without rebuilding does not update existing static assets.

Another issue to catch during deployment is CORS: the backend must include the exact frontend origin (including scheme and host, but no trailing slash) in `FRONTEND_ORIGINS`. Restarting/redeploying the backend after correcting this allowlist resolves blocked credentialed browser requests.

## Submission URLs

- Frontend: TODO
- Backend: TODO
- Frontend repository: TODO
- Backend repository: TODO
