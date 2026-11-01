# CalBUDI

> **Status: Deprecated (October 2026).** Archived as a portfolio piece. Not deployed, not maintained. Source code is private.

A multi-calendar scheduling concept: one booking link checks several people's calendars at once (e.g. SDR + AE + SE) and only offers times when **everyone** is free, in the guest's timezone. Plus NFC tap-to-meet on mobile, and routing by prospect email domain to the right account team for website and chatbot embeds.

## Why it was shelved
Calendly and Chili Piper already offer multi-calendar and round-robin scheduling, the problem is narrow, and the revenue ceiling didn't justify the build. I stopped before spending anything on infrastructure or launch.

## What I built
- **Availability engine:** per-user weekly schedules to UTC intervals, buffer padding, busy-time subtraction, cross-user intersection, 15-minute-aligned slots. Unit-tested.
- **REST API (Node, Express, TypeScript):** Google and Microsoft OAuth with free/busy-only scopes, bookings, links, NFC sessions, routing rules with CSV import, email with ICS invites, background jobs. Typechecks clean.
- **PostgreSQL schema** with row-level security and an append-only audit log.
- **React Native** screen skeleton and an **embeddable booking widget**.
- **Clickable UI prototype** (`demo/`) with mock data.

Design overview: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Principles
Privacy by design (free/busy only, event contents never read or stored), encrypted OAuth tokens, timezone-correct math in UTC, fail-closed when a calendar can't be checked.

## Honest status
Built fast at spec level. The API was never run against live Google, Microsoft, Clerk or Supabase accounts, and NFC read/write is stubbed.

© All rights reserved. See [LICENSE](LICENSE).
