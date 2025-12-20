import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

/**
 * Intercepts login errors and handles TOTP_REQUIRED responses.
 * When TOTP is required, this interceptor will trigger the TOTP login flow.
 */
@Injectable()
export class TotpLoginInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Check if this is a login request that failed with TOTP_REQUIRED
        if (
          error.error?.message === 'TOTP_REQUIRED' ||
          error.error?.errors?.[0]?.message === 'TOTP_REQUIRED'
        ) {
          // Store the original login credentials for retry
          const originalBody = req.body;
          
          // Emit a custom event that the login component can listen to
          window.dispatchEvent(
            new CustomEvent('totp-required', {
              detail: { originalRequest: originalBody },
            })
          );
          
          // Return the error so the login component can handle it
          return throwError(() => error);
        }
        
        return throwError(() => error);
      })
    );
  }
}


