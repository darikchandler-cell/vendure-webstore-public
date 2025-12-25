# Run Link S3 Images Script

**Command to run on server:**

```bash
ssh root@178.156.194.89
cd /opt/hunter-irrigation/apps/api
source .env
export NODE_ENV=production
pnpm run link-s3-images
```

**Or as one command:**

```bash
cd /opt/hunter-irrigation/apps/api && source .env && export NODE_ENV=production && pnpm run link-s3-images
```

**Expected output:**
- Script will scan all products
- Find products without assets
- Search S3 for matching images
- Create Vendure assets
- Link assets to products

**Note:** This may take a while for large catalogs (861 products).

