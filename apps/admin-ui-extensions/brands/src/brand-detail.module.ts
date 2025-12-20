import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '@vendure/admin-ui/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrandDetailComponent } from './brand-detail.component';

const routes: Routes = [
  {
    path: ':id',
    component: BrandDetailComponent,
    data: {
      breadcrumb: 'Brand',
    },
  },
];

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
  ],
  declarations: [BrandDetailComponent],
})
export class BrandDetailModule {}


