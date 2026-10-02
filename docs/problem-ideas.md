# Problem ideas

Backlog for `/new-problem`. Each idea is a realistic progressive-interview arc: every stage forces a new data structure or a refactor, not just one more method. Mark an idea `[x]` with its slug once it ships. Add new ideas at the bottom.

## Shipped

- [x] `session-timer`: open/close/count, then pause/resume, contributor reports, point-in-time history
- [x] `leaderboard`: scores, then top-k with competition ranking, score history
- [x] `in-memory-database`: set/get/delete, then prefix scans, TTL, backup/restore
- [x] `rate-limiter`: fixed window, then sliding window, client tiers, token bucket
- [x] `file-storage`: add/size/delete, then largest-by-prefix, user capacity and merge, backup/restore
- [x] `text-editor`: cursor typing, then selection and clipboard, undo/redo, multiple documents
- [x] `bank-system`: accounts and transfers, then top spenders, cashback payments, merges and balance history

## Backlog

- [ ] `parking-lot`: park/leave by spot, then fees by duration (integer cents), vehicle sizes and spot fitting, revenue for a time window
- [ ] `job-queue`: enqueue/claim/complete, then priorities with FIFO ties, retries with backoff at timestamps, job dependencies (a DAG)
- [ ] `inventory`: stock in/out, then reservations that expire, multiple warehouses with transfers, stock level at a past time
- [ ] `url-shortener`: shorten/resolve with deterministic ids, then custom aliases and collisions, click stats and top links, expiry and deletion history
- [ ] `library-checkout`: checkout/return, then a holds queue per book, late fees, member history queries
- [ ] `chat-server`: send/read, then channels and unread counts, message edits and deletes, search by time range
- [ ] `kv-transactions`: get/set/delete/count, then begin/commit/rollback, nested transactions, snapshot reads
- [ ] `hotel-reservations`: book/cancel by date range, then overlap detection across rooms, room types and free upgrades, occupancy report
- [ ] `order-book`: place limit orders, then price-time matching, cancels and partial fills, VWAP and trade history
- [ ] `mini-git`: commit/checkout of a file map, then branches, three-way merge with conflict reporting, log and blame
- [ ] `seat-booking`: hold/confirm seats, then expiring holds, best available contiguous block, refunds and a waitlist
- [ ] `spreadsheet`: set/get cells, then formulas with references, cycle detection, undo
- [ ] `lru-cache`: get/put with capacity, then TTL, LFU eviction with LRU tie-break, hit-rate stats
- [ ] `auction-house`: bids, then auto-close at a timestamp, proxy (max) bidding, seller reports
- [ ] `course-registration`: enroll/drop, then capacity and waitlist promotion, prerequisites, schedule conflicts
- [ ] `expense-splitter`: add expenses (integer cents), then per-person balances, minimal settle-up transfers, groups and history
- [ ] `feature-flags`: on/off flags, then per-user targeting, deterministic percentage rollout, audit history at a point in time
- [ ] `pub-sub`: subscribe/publish, then topic wildcards, at-least-once delivery with acks, replay from offset
- [ ] `package-manager`: add packages with deps, then install order (topological sort), version constraints, uninstall orphans
- [ ] `elevator-system`: request/step simulation, then direction-aware scheduling (SCAN), multiple elevators, wait-time stats
