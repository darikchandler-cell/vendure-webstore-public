# Brands Admin UI Setup Guide

## ✅ What's Been Created

### Backend (Complete)
- ✅ Brand entity and GraphQL API
- ✅ Brand service and resolvers
- ✅ Product custom fields (including brandId)

### Admin UI Extension (Created, needs build)
- ✅ Extension package structure (`apps/admin-ui-extensions/brands/`)
- ✅ Brand list component
- ✅ Brand detail/edit component
- ✅ GraphQL integration
- ⚠️ Needs: Build and server restart

## 🚀 Setup Steps

### 1. Install Dependencies

```bash
cd apps/admin-ui-extensions/brands
pnpm install
```

### 2. Build the Extension

```bash
cd apps/admin-ui-extensions/brands
pnpm run build
```

This compiles the TypeScript to JavaScript in the `dist/` directory.

### 3. Restart the Vendure Server

After building, restart the API server so it picks up the extension:

```bash
# If running in dev mode, stop and restart
cd apps/api
pnpm run dev
```

### 4. Access Brands in Admin UI

1. Go to `http://localhost:3000/admin`
2. Log in
3. Navigate to **Catalog** → **Brands** in the sidebar
4. You should see the Brands management interface

## 📋 What You Can Do

### Create Brands
- Click "Create Brand" button
- Fill in name, slug, description, website URL, logo asset ID
- Save

### Edit Brands
- Click on any brand name in the list
- Modify the fields
- Save changes

### Delete Brands
- Click the action menu (three dots) on a brand row
- Select "Delete"
- Confirm

### Use Brands in Products
1. Go to **Catalog** → **Products**
2. Edit a product
3. In the **Custom Fields** section, find "Brand ID"
4. Enter the brand ID (you can get this from the Brands list URL when viewing a brand)

## 🔧 Troubleshooting

### Extension Not Showing

1. **Check if extension is built:**
   ```bash
   ls apps/admin-ui-extensions/brands/dist/
   ```
   Should show compiled `.js` files

2. **Check server logs:**
   Look for errors about loading extensions

3. **Verify config:**
   Check that `apps/api/src/vendure-config.ts` includes the brands extension path in `AdminUiPlugin.init()`

### Build Errors

If you get TypeScript errors:
```bash
cd apps/admin-ui-extensions/brands
pnpm install
pnpm run build
```

Common issues:
- Missing dependencies → Run `pnpm install`
- Type errors → Check that all imports are correct

## 🎯 Next Steps (Optional Enhancements)

1. **Brand Selector in Product Editor**
   - Replace the text input for `brandId` with a dropdown selector
   - This requires creating a custom field control component

2. **Brand Logo Upload**
   - Add asset picker directly in the brand form
   - Use Vendure's asset management

3. **Brand Filtering**
   - Add search and filter options to the brand list
   - Filter by name, slug, etc.

4. **Brand Usage Stats**
   - Show how many products use each brand
   - Display in the brand list

## 📝 Notes

- The `brandId` field in products is currently a text input. To make it a dropdown, we'd need to create a custom field control component.
- Brand slugs are auto-generated from the name if not provided
- All brand fields are optional except `name`
- The extension uses the same GraphQL API that's available in the shop API


