# Admin UI Extensions - Complete Setup

## ✅ What's Been Created

### 1. **Brands Admin UI Extension** (`apps/admin-ui-extensions/brands/`)
   - ✅ Brand list component with pagination
   - ✅ Brand detail/edit component
   - ✅ GraphQL integration
   - ✅ Full CRUD operations
   - ✅ Routing configured

### 2. **Custom Fields in Admin UI**
   - ✅ All product custom fields automatically appear in product editor
   - ✅ All variant custom fields automatically appear in variant editor
   - ✅ Fields are in the "Custom Fields" section when editing products/variants

## 📋 Current Status

### ✅ Working Now (No Build Required)
- **Custom Fields**: All product and variant custom fields are automatically available in the Admin UI:
  - Product: `brandId`, `shortDescription`, `metaTitle`, `metaDescription`, `keywords`
  - Variant: `weight`, `length`, `width`, `height`, `customStockStatus`, `upc`
  
  These appear automatically when you edit a product or variant in the Admin UI.

### ⚠️ Needs Build (Brands Management UI)
- **Brands Management Pages**: The extension is created but needs to be compiled with the Vendure Admin UI build system.

## 🚀 How to Access What's Available Now

### 1. Custom Fields in Product Editor

1. Go to `http://localhost:3000/admin`
2. Navigate to **Catalog** → **Products**
3. Click on any product to edit
4. Scroll down to the **"Custom Fields"** section
5. You'll see all the new fields:
   - **Brand ID** (text input - enter the brand UUID)
   - **Short Description** (textarea)
   - **Meta Title** (text input)
   - **Meta Description** (textarea)
   - **Keywords** (text input)

### 2. Custom Fields in Variant Editor

1. When editing a product, click on a variant
2. Scroll to **"Custom Fields"** section
3. You'll see:
   - **Weight (grams)** (number input)
   - **Length (mm)** (number input)
   - **Width (mm)** (number input)
   - **Height (mm)** (number input)
   - **Custom Stock Status** (text input)
   - **UPC** (text input)

### 3. Brands via GraphQL (Until UI is Built)

You can manage brands using the GraphQL playground:

1. Go to `http://localhost:3000/admin-api`
2. Use these queries/mutations:

**List Brands:**
```graphql
query {
  brands {
    items {
      id
      name
      slug
      description
      websiteUrl
    }
    totalItems
  }
}
```

**Create Brand:**
```graphql
mutation {
  createBrand(input: {
    name: "Hunter"
    slug: "hunter"
    description: "Hunter Irrigation Products"
    websiteUrl: "https://hunter.com"
  }) {
    id
    name
  }
}
```

**Get Brand by ID:**
```graphql
query {
  brand(id: "brand-uuid-here") {
    id
    name
    slug
  }
}
```

## 🔧 Building the Brands Admin UI Extension

The Brands Admin UI extension needs to be compiled as part of the Vendure Admin UI build. In Vendure 2.3.3, this typically happens:

### Option 1: Development Mode (Automatic)
When you run `pnpm run dev` in the API, the Admin UI extensions are automatically compiled if configured correctly.

### Option 2: Manual Build (If Needed)
The extension structure is ready. The actual compilation happens when:
1. The Vendure server starts in dev mode, OR
2. You build the Admin UI for production

The extension is already registered in `vendure-config.ts`:
```typescript
AdminUiPlugin.init({
  app: {
    extensions: [
      path.join(__dirname, '../../admin-ui-extensions/totp-mfa/src/index.ts'),
      path.join(__dirname, '../../admin-ui-extensions/brands/src/index.ts'),
    ],
  },
})
```

## 📝 What You Can Do Right Now

### ✅ Use Custom Fields
1. Edit any product → Custom Fields section
2. Fill in:
   - Brand ID (get from GraphQL query)
   - Short Description
   - Meta Title & Description
   - Keywords
3. Save

### ✅ Use Variant Custom Fields
1. Edit product variant → Custom Fields section
2. Fill in:
   - Weight, Length, Width, Height
   - Custom Stock Status
   - UPC
3. Save

### ✅ Manage Brands via GraphQL
- Use the GraphQL playground at `/admin-api`
- Create, read, update, delete brands
- Copy brand IDs to use in product `brandId` field

## 🎯 Next Steps

1. **Test Custom Fields**: Try editing a product and filling in the custom fields
2. **Create Brands**: Use GraphQL to create some brands
3. **Link Products to Brands**: Use the brand IDs in product custom fields
4. **Wait for Admin UI Build**: The Brands management UI will be available once the Admin UI is rebuilt (usually happens automatically in dev mode)

## 📚 Files Created

### Admin UI Extension
- `apps/admin-ui-extensions/brands/` - Complete extension structure
- `apps/admin-ui-extensions/brands/src/brand-list.*` - Brand list page
- `apps/admin-ui-extensions/brands/src/brand-detail.*` - Brand create/edit page
- `apps/admin-ui-extensions/brands/src/index.ts` - Extension registration

### Configuration
- `apps/api/src/vendure-config.ts` - Updated to include brands extension
- `BRANDS_UI_SETUP.md` - Detailed setup guide
- `ADMIN_UI_EXTENSIONS_SUMMARY.md` - This file

## ⚠️ Important Notes

1. **Custom Fields Work Immediately**: No build needed - they appear automatically
2. **Brands UI Needs Compilation**: The extension will be available after Admin UI rebuild
3. **Brand ID Field**: Currently a text input - you need to enter the UUID manually (or get it from GraphQL)
4. **Future Enhancement**: We can create a brand selector dropdown to replace the text input

## 🐛 Troubleshooting

### Custom Fields Not Showing
- Make sure the server has been restarted after adding custom fields
- Check that `ProductEnhancementsPlugin` is in the plugins array
- Verify the custom fields are defined in `vendure-config.ts`

### Brands UI Not Showing
- The extension needs to be compiled with the Admin UI
- Check server logs for extension loading errors
- Verify the extension path in `vendure-config.ts` is correct


