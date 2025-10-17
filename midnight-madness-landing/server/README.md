# Midnight Madness Server

Express backend for manual ticket registration and admin approval.

## Environment Variables

| Name | Description |
|------|-------------|
| `PORT` | Port for the API server (default `5000`). |
| `MONGO_URI` | MongoDB connection string. |
| `CLIENT_URL` | Frontend URL allowed via CORS (comma-separated for multiple). |
| `ADMIN_CLIENT_URL` | Admin UI URL allowed via CORS. |
| `ADMIN_API_KEY` | Shared key for admin API access. |
| `ADMIN_JWT_SECRET` | Secret used to sign/verify admin JWTs. |
| `VITE_MANUAL_VF_CASH_NUMBER` | Vodafone Cash number displayed to users. |
| `VITE_MANUAL_INSTAPAY_HANDLE` | InstaPay handle displayed to users. |
| `EMAIL_USER` / `EMAIL_PASS` | SMTP credentials for ticket emails. |

Optional overrides:

| Name | Description |
|------|-------------|
| `BASE_FRONTEND_URL` | Public site URL referenced in emails. |
| `BACKEND_VERIFY_BASE_URL` | Explicit API base for QR payload links. |

## Manual Registration Flow

1. `POST /api/tickets/manual`
   - Body contains package type, contact email, payment note, and attendee list.
   - Returns `{ ticketId, status }` with `status = "pending_manual_payment"`.

2. Admin portal fetches pending tickets via the admin server proxy.

3. Admin marks a ticket paid -> backend generates a QR payload and emails every attendee.

4. Scanning the QR reveals the ticket payload (ticket ID, package type, attendee contact details).

## Scripts

- `node scripts/migrate_cleanup.js`
  - Resets legacy tickets with status `approved` to `pending_manual_payment`.
  - Strips deprecated payment provider fields and prints a summary.
