import { Provider } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TotpLoginInterceptor } from './totp-login.interceptor';

export const providers: Provider[] = [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: TotpLoginInterceptor,
    multi: true,
  },
];


