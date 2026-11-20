Naija Rent & Trust MVP

A production-oriented Nigerian rental marketplace with transparent pricing, human-reviewed listings, and a premium dark-aurora UI. Built with Node.js, Express, MongoDB, and vanilla HTML/CSS/JS — no frontend framework, lightweight enough for Nigerian mobile networks.

📌 Overview

Naija Rent & Trust is a rental marketplace MVP for Nigeria. It replaces the "simulated verification" pattern of typical demos with a human-review workflow: every listing is manually approved by an admin before going live, and every listing carries a review history (submitted → approved/rejected → updated) so renters and listers see exactly what happened and when.

A "Reviewed" badge is not a guarantee of ownership, condition, or legal status. Users are always told to inspect in person before paying.

✨ Features

For Renters
Search and filter listings (state, area, type, rent range, bedrooms, bathrooms, keyword)

Transparent fee breakdown — annual rent, agency fee, legal fee, caution deposit, total move-in cost (all in ₦ Naira)

View review history per listing

Send an enquiry with preferred inspection date (no account required)

Report suspicious listings (fake, wrong price, already rented, suspicious agent, other)

Optimized WebP images, lazy loading, low-data friendly UI

For Listers (Landlords & Agents)
Secure registration with email verification

Create listings — up to 5 images (auto-optimized to WebP)

Live fee calculator and total move-in preview

Manage listings: edit, mark as rented, see review status and admin notes

View and manage enquiries (New → Contacted)

Full review history for each listing

Rejected listings include the reason so they can be fixed and resubmitted

For Admins
Protected admin login with optional 2FA (TOTP)

Review queue: approve or reject pending listings with reasons

Report moderation queue: review, dismiss, unpublish, restore

Manual review flag management with audit trail

Dashboard statistics (published, pending, rented, rejected, reports)

Full action history per listing

Security & Compliance
bcrypt password hashing (cost 12)

JWT access tokens + refresh tokens (httpOnly cookies)

Login lockout after failed attempts

Email verification and password reset flows

NDPR-aligned Privacy Policy, Terms of Service, Cookie Policy, Refund Policy

Cookie consent banner

Rate limiting (configurable per endpoint)

Helmet, CORS, Mongo sanitization

MIME-validated image uploads (JPG/PNG/WEBP, max 1MB, max 5 per listing)

🛠️ Tech Stack
Layer Technology
Runtime Node.js 18+
Framework Express.js
Database MongoDB Atlas / Mongoose
Auth JWT (access + refresh), bcryptjs
File Uploads Multer + Sharp (WebP compression)
Email Nodemailer (SMTP — Gmail, Resend, Postmark, etc.)
Frontend Vanilla HTML5, CSS3, ES6+
Security Helmet, CORS, express-rate-limit, express-mongo-sanitize
Logging Pino
Deployment Render (Node Web Service)

naija-rent-trust-mvp/
├── config/ # env, db connection
├── controllers/ # auth, properties, enquiries, reports, admin
├── middleware/ # auth, security, upload, errorHandler
├── models/ # User, Property, Enquiry, Report
├── routes/ # API route definitions
├── services/ # mailer, logger, tokens
├── utils/ # token, cookie, format helpers
├── scripts/ # seed.js, migrate-v2.js, build-favicons.js
├── tests/ # test suites
├── uploads/ # processed listing images (gitignored)
├── public/
│ ├── css/ # style.css, home.css
│ ├── js/ # api.js, ui.js, components.js, animations.js, forms.js, home.js
│ ├── images/ # logo, placeholder, empty-state SVGs
│ ├── pages/ # all .html pages
│ ├── favicon.svg
│ ├── favicon-\*.png
│ ├── manifest.webmanifest
│ └── index.html
├── .env # local secrets (NEVER commit)
├── .env.example # template with placeholders
├── .gitignore
├── package.json
├── server.js
└── README.md

🚀 Local Setup

1. Prerequisites
   Node.js 18 or higher (node -v)

MongoDB Atlas account (free tier works) or local MongoDB

Git

VS Code (recommended)

2. Clone the repository

git clone https://github.com/YOUR_USERNAME/naija-rent-trust-mvp.git
cd naija-rent-trust-mvp

3. Install dependencies

npm install

4. Configure environment variables

copy .env.example .env

Generate JWT secrets:

node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex')); console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'));"

5. Seed the database (optional — demo data)

npm run seed

6. Run the app

# Development (auto-restart)

npm run dev

# Production

npm start

7. Migrate existing demo data (if upgrading)

If you previously ran the demo version, migrate old data:

node scripts/migrate-v2.js
