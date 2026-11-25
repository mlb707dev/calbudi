# CalBUDI

> **Archived concept.** Deprecated as a standalone project. Source code is private.

A scheduling concept for go-to-market teams: one booking link that only offers times when everyone who needs to be in the meeting is free, plus a way to book on the spot when two people meet in person.

## What this repo shows

- A product idea taken from a written spec to a reference build, with AI as the development partner.
- A clickable interface prototype in [`demo/`](demo/).
- Privacy by design from the first draft: calendars are only ever asked whether someone is busy or free, never what the meeting is.

## How I built it

I wrote the product spec and made the product and security decisions, then directed Claude to build against that spec, and checked the core with type checks and tests.

**Scope:** a reference build. Outside services were stubbed, not connected.

© All rights reserved. See [LICENSE](LICENSE).
