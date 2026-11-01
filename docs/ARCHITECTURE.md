# CalBUDI Architecture

## Problem
A scheduling link that checks several people's calendars at once and only offers times when all of them are free, rendered in the guest's timezone. Guests can add colleagues, which re-runs availability. Secondary features: NFC tap-to-meet between two phones, and routing by prospect email domain to the right account team.

## Core algorithm (`shared/availability/engine.ts`)
1. Convert each user's weekly availability windows (in their own timezone) into concrete UTC intervals for the date range.
2. Pull busy intervals from each connected calendar and pad them with buffer time.
3. Subtract busy time from availability, giving each user's free intervals.
4. Intersect free intervals across all users to get mutual free time.
5. Slice into slots of the requested length, aligned to 15-minute boundaries.
Before booking, the chosen slot is re-checked against fresh free/busy to prevent double-booking.

## Stack
React Native (mobile), Node + Express + TypeScript (API), PostgreSQL on Supabase with row-level security, Clerk (auth), Resend (email), BullMQ + Redis (jobs), Google Calendar API and Microsoft Graph for free/busy.

## Data model (`api/db/schema.sql`)
users, organizations, org_members, calendar_connections (encrypted OAuth tokens), availability_schedules (JSONB weekly windows), booking_links (team member list, custom questions), bookings, routing_rules, nfc_sessions (10-minute TTL), audit_logs (append-only).

## API surface
- Auth: Google and Microsoft OAuth start/callback, disconnect a calendar
- Availability: query mutual slots, public slots for a link, refresh when a guest adds attendees
- Links and bookings: CRUD for links, public booking page, create/cancel/reschedule/add-guests
- NFC: create session, join, fetch top mutual slots, book
- Routing: resolve email domain to a booking link, rules CRUD, CSV bulk import (`email_domain, account_name, ae_email, se_email, sdr_email`)

## NFC flow
Initiator creates a session and writes a deep link containing a one-time token to an NFC tag. The second phone reads it and joins. The server computes the top three mutual slots over the next 14 days, and either person confirms one.

## Security design
- Free/busy scopes only. Event titles and contents are never read or stored, and free/busy results are never persisted.
- OAuth tokens encrypted with AES-256-GCM before storage; never returned to clients.
- Zod validation on all inputs, rate limiting, CORS allowlist, Helmet headers.
- If a calendar can't be checked, it is treated as fully busy (fail closed).
