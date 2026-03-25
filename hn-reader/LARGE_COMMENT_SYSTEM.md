# Large Comment System Load Handling

This note explains how the system handles heavy comment trees and high read traffic.

## Problem

Hacker News discussions can become very large and deeply nested. Loading everything at once causes:
- Slow initial response time
- Large payloads
- Higher memory pressure in browser and server

## Approach

1. Pagination at top-level comments
- Endpoint supports limit and offset.
- Client loads comments in chunks instead of one giant payload.

2. Depth control
- Endpoint supports depth as a number or all.
- Default depth is conservative to keep first paint fast.

3. Lazy reply loading
- Replies can be fetched on demand per comment node.
- This avoids eagerly loading nested branches users may never open.

4. Query caching on frontend
- React Query caches comment pages and reduces repeat API calls.
- Stale time and retry behavior are tuned for good UX.

5. Protective limits
- Request parsing enforces bounded integer values.
- This prevents accidental oversized requests.

## API Controls Used

- GET /api/stories/:id/comments?depth=1&limit=20&offset=0
- GET /api/stories/:id/comments/:commentId/replies?depth=1

## Why This Works

- Time to first content is reduced because initial payload is smaller.
- Network and render cost scale with what the user actually explores.
- System remains predictable under large threads.

## Tradeoff

Users may perform more requests while expanding deeply. We accepted this because smaller requests improve responsiveness and reliability for large discussions.
