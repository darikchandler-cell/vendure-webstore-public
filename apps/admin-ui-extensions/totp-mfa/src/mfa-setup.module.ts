import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '@vendure/admin-ui/core';
import { QRCodeModule } from 'angularx-qrcode';
import { FormsModule } from '@angular/forms';
import { MfaSetupComponent } from './mfa-setup.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: MfaSetupComponent,
    data: {
      breadcrumb: 'Two-Factor Authentication',
    },
  },
];

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    QRCodeModule,
    FormsModule,
  ],
  declarations: [MfaSetupComponent],
})
export class MfaSetupModule {}

