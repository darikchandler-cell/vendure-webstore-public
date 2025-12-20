import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '@vendure/admin-ui/core';
import { BrandListComponent } from './brand-list.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: BrandListComponent,
    data: {
      breadcrumb: 'Brands',
    },
  },
];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [BrandListComponent],
})
export class BrandListModule {}


