# Brands Admin UI Extension

This Admin UI extension provides a complete interface for managing brands in the Vendure Admin.

## Features

1. **Brand List Page** - Accessible at `/admin/catalog/brands`
   - View all brands in a data table
   - Create new brands
   - Edit existing brands
   - Delete brands
   - Pagination support

2. **Brand Detail/Edit Page** - Accessible at `/admin/catalog/brands/:id`
   - Create new brands
   - Edit brand details (name, slug, description, website, logo)
   - Form validation

## Installation

1. Install dependencies:
   ```bash
   cd apps/admin-ui-extensions/brands
   pnpm install
   ```

2. Build the extension:
   ```bash
   pnpm run build
   ```

3. The extension is automatically registered in `vendure-config.ts` via `AdminUiPlugin.init()`

## Usage

### Accessing Brands

1. Log in to the Vendure Admin UI
2. Navigate to **Catalog** → **Brands** in the sidebar
3. You'll see a list of all brands

### Creating a Brand

1. Click the **"Create Brand"** button
2. Fill in the brand details:
   - **Name** (required): The brand name
   - **Slug**: URL-friendly identifier (auto-generated if left empty)
   - **Description**: Brand description
   - **Website URL**: Link to brand's website
   - **Logo Asset ID**: ID of an uploaded asset to use as logo
3. Click **"Save"**

### Editing a Brand

1. Click on a brand name in the list, or click the edit icon
2. Modify the fields as needed
3. Click **"Save"**

### Deleting a Brand

1. Click the action menu (three dots) on a brand row
2. Select **"Delete"**
3. Confirm the deletion

### Using Brands in Products

When editing a product, you can set the `brandId` custom field:
1. Go to **Catalog** → **Products**
2. Edit a product
3. Scroll to the **Custom Fields** section
4. Enter the Brand ID in the "Brand ID" field
   - You can find the Brand ID by going to the Brands list and copying the ID from the URL when viewing a brand

## Development

The extension uses:
- Angular (Vendure Admin UI framework)
- Vendure UI DevKit for extension structure
- GraphQL for data fetching and mutations

## Components

- `BrandListComponent` - Displays the list of brands with pagination
- `BrandDetailComponent` - Form for creating/editing brands

## GraphQL Queries & Mutations

The extension uses these GraphQL operations:
- `brands` - Query to list all brands
- `brand(id)` - Query to get a single brand
- `createBrand` - Mutation to create a new brand
- `updateBrand` - Mutation to update an existing brand
- `deleteBrand` - Mutation to delete a brand

## Future Enhancements

- Brand selector dropdown in product editor (instead of text input for brandId)
- Brand logo upload directly in the brand form
- Brand filtering and search
- Brand usage statistics (how many products use each brand)


