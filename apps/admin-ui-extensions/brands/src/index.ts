import { AdminUiExtension } from '@vendure/ui-devkit/compiler';

export const extensions: AdminUiExtension = {
  id: 'brands',
  extensions: [
    {
      type: 'sharedModule',
      ngModules: [
        {
          type: 'lazy',
          route: 'catalog/brands',
          ngModuleFileName: 'brand-list.module.ts',
          ngModuleName: 'BrandListModule',
        },
        {
          type: 'lazy',
          route: 'catalog/brands/:id',
          ngModuleFileName: 'brand-detail.module.ts',
          ngModuleName: 'BrandDetailModule',
        },
      ],
    },
  ],
  providers: ['providers.ts'],
};


