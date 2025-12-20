import { Component, OnInit } from '@angular/core';
import { gql, DataService } from '@vendure/admin-ui/core';
import { Router } from '@angular/router';

const GET_BRANDS = gql`
  query GetBrands($options: BrandListOptions) {
    brands(options: $options) {
      items {
        id
        name
        slug
        description
        websiteUrl
        createdAt
        updatedAt
      }
      totalItems
    }
  }
`;

const DELETE_BRAND = gql`
  mutation DeleteBrand($id: ID!) {
    deleteBrand(id: $id)
  }
`;

@Component({
  selector: 'vdr-brand-list',
  templateUrl: './brand-list.component.html',
  styleUrls: ['./brand-list.component.scss'],
})
export class BrandListComponent implements OnInit {
  brands: any[] = [];
  totalItems = 0;
  isLoading = false;
  pageSize = 10;
  currentPage = 1;

  constructor(
    private dataService: DataService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadBrands();
  }

  async loadBrands() {
    this.isLoading = true;
    try {
      const result = await this.dataService
        .query<{ brands: { items: any[]; totalItems: number } }>(GET_BRANDS, {
          options: {
            skip: (this.currentPage - 1) * this.pageSize,
            take: this.pageSize,
          },
        })
        .toPromise();

      if (result?.brands) {
        this.brands = result.brands.items;
        this.totalItems = result.brands.totalItems;
      }
    } catch (error) {
      console.error('Error loading brands:', error);
    } finally {
      this.isLoading = false;
    }
  }

  createBrand() {
    this.router.navigate(['/catalog/brands', 'create']);
  }

  editBrand(brand: any) {
    this.router.navigate(['/catalog/brands', brand.id]);
  }

  async deleteBrand(brand: any) {
    if (!confirm(`Are you sure you want to delete "${brand.name}"?`)) {
      return;
    }

    try {
      await this.dataService
        .mutate(DELETE_BRAND, { id: brand.id })
        .toPromise();
      this.loadBrands();
    } catch (error) {
      console.error('Error deleting brand:', error);
      alert('Failed to delete brand');
    }
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadBrands();
  }
}


