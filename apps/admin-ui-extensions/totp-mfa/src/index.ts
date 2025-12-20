import { AdminUiExtension } from '@vendure/ui-devkit/compiler';

export const extensions: AdminUiExtension = {
  id: 'totp-mfa',
  extensions: [
    {
      type: 'sharedModule',
      ngModules: [
        {
          type: 'lazy',
          route: 'settings/security',
          ngModuleFileName: 'mfa-setup.module.ts',
          ngModuleName: 'MfaSetupModule',
        },
      ],
    },
  ],
  providers: ['providers.ts'],
};


