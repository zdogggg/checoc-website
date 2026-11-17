# Integration tests

They drive a running server through its API and check the database directly:
checkout (pricing, retries, limits, coupons), delivery (stock, cost, points, spend) and refunds.
Everything they create uses phone numbers starting with `090999`, coupon codes starting with
`ITEST` and ingredients named `ZZ-IT ...`, and is removed before and after the run.

Locally, with the dev containers up (credentials come from `.env`):

```bash
docker exec checoc_frontend npm run test:integration
```

The server must accept orders at the time you run them: outside opening hours start it with
`NUXT_IGNORE_OPENING_HOURS=true`. CI (`.github/workflows/ci.yml`) builds the app, seeds an
empty database and runs them on every push.

Do not point them at the real shop's database: they create and delete orders.
