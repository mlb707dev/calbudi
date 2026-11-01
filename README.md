# CalBUDI

> **Archived reference build.** Product spec and architecture complete. Source code is private.

A multi-calendar scheduling product: one booking link checks several people's calendars at once (e.g. SDR + AE + SE) and only offers times when **everyone** is free, in the guest's timezone. Plus NFC tap-to-meet on mobile, and routing by prospect email domain to the right account team for website and chatbot embeds.

## What I designed
- **Core differentiator:** mutual availability across multiple calendars, computed per user in UTC (schedules, buffers, busy time), then intersected across all attendees and sliced into 15-minute-aligned slots. Covered by unit tests.
- **API (Node, Express, TypeScript):** Google and Microsoft OAuth restricted to free/busy scopes, bookings, links, NFC sessions, routing rules with CSV import for territory and account mapping, email with ICS invites, background jobs. Typechecks clean.
- **Data layer:** PostgreSQL schema with row-level security and an append-only audit log.
- **Surfaces:** React Native screen skeleton, an embeddable booking widget, and a clickable UI prototype (`demo/`).

Design overview: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Design principles I set
Privacy by design (free/busy only; event contents are never read or stored), encrypted OAuth tokens, timezone-correct math in UTC, and fail-closed behavior when a calendar can't be checked.

## How I built it
I wrote the product spec and made the architecture and security decisions, then directed Claude to implement against that spec. I verified the core with type checks and tests on the availability engine.

**Scope:** reference implementation. Third-party integrations (Google, Microsoft, Clerk, Supabase) and NFC read/write are stubbed.

© All rights reserved. See [LICENSE](LICENSE).
