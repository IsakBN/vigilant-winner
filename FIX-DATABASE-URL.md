# Fix DATABASE_URL

```bash
echo 'postgresql://neondb_owner:YOUR_PASSWORD@ep-YOUR-HOST-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require' | npx wrangler secret put DATABASE_URL
```
