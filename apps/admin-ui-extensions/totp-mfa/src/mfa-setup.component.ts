import { Component, OnInit } from '@angular/core';
import { gql } from 'apollo-angular';
import { DataService } from '@vendure/admin-ui/core';
import { FormsModule } from '@angular/forms';

const INIT_TOTP_SETUP = gql`
  mutation InitTotpSetup($password: String!) {
    initTotpSetup(password: $password) {
      secret
      qrCodeUri
    }
  }
`;

const ENABLE_TOTP = gql`
  mutation EnableTotp($token: String!) {
    enableTotp(token: $token) {
      success
    }
  }
`;

const IS_TOTP_ENABLED = gql`
  query IsTotpEnabled {
    isTotpEnabled
  }
`;

const DISABLE_TOTP = gql`
  mutation DisableTotp($password: String!) {
    disableTotp(password: $password) {
      success
    }
  }
`;

@Component({
  selector: 'vdr-mfa-setup',
  templateUrl: './mfa-setup.component.html',
  styleUrls: ['./mfa-setup.component.scss'],
})
export class MfaSetupComponent implements OnInit {
  isEnabled = false;
  isLoading = false;
  qrCodeUri: string | null = null;
  secret: string | null = null;
  setupStep: 'initial' | 'qr-display' | 'verification' | 'enabled' = 'initial';
  totpToken = '';
  password = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private dataService: DataService) {}

  async ngOnInit() {
    await this.checkTotpStatus();
  }

  async checkTotpStatus() {
    try {
      const result = await this.dataService
        .query<{ isTotpEnabled: boolean }>(IS_TOTP_ENABLED)
        .toPromise();
      this.isEnabled = result?.isTotpEnabled || false;
    } catch (error) {
      console.error('Error checking TOTP status:', error);
    }
  }

  async startSetup() {
    if (!this.password) {
      this.errorMessage = 'Please enter your password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    try {
      const result = await this.dataService
        .mutate<{ initTotpSetup: { secret: string; qrCodeUri: string } }>(
          INIT_TOTP_SETUP,
          { password: this.password }
        )
        .toPromise();

      if (result?.initTotpSetup) {
        this.qrCodeUri = result.initTotpSetup.qrCodeUri;
        this.secret = result.initTotpSetup.secret;
        this.setupStep = 'qr-display';
        this.password = ''; // Clear password for security
      }
    } catch (error: any) {
      this.errorMessage =
        error.message || 'Failed to initialize TOTP setup';
    } finally {
      this.isLoading = false;
    }
  }

  async verifyAndEnable() {
    if (!this.totpToken || this.totpToken.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit code';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    try {
      const result = await this.dataService
        .mutate<{ enableTotp: { success: boolean } }>(ENABLE_TOTP, {
          token: this.totpToken,
        })
        .toPromise();

      if (result?.enableTotp?.success) {
        this.setupStep = 'enabled';
        this.isEnabled = true;
        this.successMessage = 'Two-factor authentication has been enabled successfully!';
        this.qrCodeUri = null;
        this.secret = null;
        this.totpToken = '';
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to enable TOTP';
    } finally {
      this.isLoading = false;
    }
  }

  async disableTotp() {
    if (!this.password) {
      this.errorMessage = 'Please enter your password to disable MFA';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    try {
      const result = await this.dataService
        .mutate<{ disableTotp: { success: boolean } }>(DISABLE_TOTP, {
          password: this.password,
        })
        .toPromise();

      if (result?.disableTotp?.success) {
        this.isEnabled = false;
        this.successMessage = 'Two-factor authentication has been disabled';
        this.password = '';
        this.setupStep = 'initial';
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to disable TOTP';
    } finally {
      this.isLoading = false;
    }
  }

  resetSetup() {
    this.setupStep = 'initial';
    this.qrCodeUri = null;
    this.secret = null;
    this.totpToken = '';
    this.password = '';
    this.errorMessage = null;
    this.successMessage = null;
  }
}

