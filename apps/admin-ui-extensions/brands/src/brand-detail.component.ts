import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { gql, DataService } from '@vendure/admin-ui/core';

const GET_BRAND = gql`
  query GetBrand($id: ID!) {
    brand(id: $id) {
      id
      name
      slug
      description
      logoAssetId
      websiteUrl
      createdAt
      updatedAt
    }
  }
`;

const CREATE_BRAND = gql`
  mutation CreateBrand($input: CreateBrandInput!) {
    createBrand(input: $input) {
      id
      name
      slug
    }
  }
`;

const UPDATE_BRAND = gql`
  mutation UpdateBrand($input: UpdateBrandInput!) {
    updateBrand(input: $input) {
      id
      name
      slug
    }
  }
`;

@Component({
  selector: 'vdr-brand-detail',
  templateUrl: './brand-detail.component.html',
  styleUrls: ['./brand-detail.component.scss'],
})
export class BrandDetailComponent implements OnInit {
  brandForm: FormGroup;
  brandId: string | null = null;
  isNew = false;
  isLoading = false;
  isSaving = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private dataService: DataService
  ) {
    this.brandForm = this.fb.group({
      name: ['', Validators.required],
      slug: [''],
      description: [''],
      websiteUrl: [''],
      logoAssetId: [''],
    });
  }

  ngOnInit() {
    this.brandId = this.route.snapshot.paramMap.get('id');
    this.isNew = this.brandId === 'create' || !this.brandId;

    if (!this.isNew && this.brandId) {
      this.loadBrand(this.brandId);
    }
  }

  async loadBrand(id: string) {
    this.isLoading = true;
    try {
      const result = await this.dataService
        .query<{ brand: any }>(GET_BRAND, { id })
        .toPromise();

      if (result?.brand) {
        this.brandForm.patchValue({
          name: result.brand.name || '',
          slug: result.brand.slug || '',
          description: result.brand.description || '',
          websiteUrl: result.brand.websiteUrl || '',
          logoAssetId: result.brand.logoAssetId || '',
        });
      }
    } catch (error) {
      console.error('Error loading brand:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async save() {
    if (this.brandForm.invalid) {
      return;
    }

    this.isSaving = true;
    const formValue = this.brandForm.value;

    try {
      if (this.isNew) {
        const result = await this.dataService
          .mutate<{ createBrand: { id: string } }>(CREATE_BRAND, {
            input: formValue,
          })
          .toPromise();

        if (result?.createBrand?.id) {
          this.router.navigate(['/catalog/brands', result.createBrand.id]);
        }
      } else if (this.brandId) {
        await this.dataService
          .mutate(UPDATE_BRAND, {
            input: {
              id: this.brandId,
              ...formValue,
            },
          })
          .toPromise();
      }
    } catch (error) {
      console.error('Error saving brand:', error);
      alert('Failed to save brand');
    } finally {
      this.isSaving = false;
    }
  }

  cancel() {
    this.router.navigate(['/catalog/brands']);
  }
}


