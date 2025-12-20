# Current Status Check

## ✅ Test Results

Run this to check current status:

```bash
# Test all endpoints
echo "=== Storefront ===" && curl -s -o /dev/null -w "HTTP %{http_code}\n" https://hunterirrigationsupply.com
echo "=== CA Storefront ===" && curl -s -o /dev/null -w "HTTP %{http_code}\n" https://hunterirrigation.ca
echo "=== Admin UI ===" && curl -s -o /dev/null -w "HTTP %{http_code}\n" https://hunterirrigationsupply.com/admin
echo "=== Admin API ===" && curl -s -X POST https://hunterirrigationsupply.com/admin-api -H "Content-Type: application/json" -d '{"query":"{ __typename }"}' -w "\nHTTP %{http_code}\n" | tail -1
echo "=== Shop API ===" && curl -s -X POST https://hunterirrigationsupply.com/shop-api -H "Content-Type: application/json" -d '{"query":"{ activeChannel { id } }"}' -w "\nHTTP %{http_code}\n" | tail -1
```

## Expected Results

- ✅ **200** = Working
- ❌ **502** = Service not running
- ❌ **500** = Server error
- ⚠️ **301/302** = Redirect (usually OK)

