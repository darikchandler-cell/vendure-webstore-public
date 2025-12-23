import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import { Ctx, RequestContext, Allow, Permission } from '@vendure/core';
import { BrandService } from './brand.service';
import { Brand } from './entities/brand.entity';

@Resolver()
export class BrandResolver {
  constructor(private brandService: BrandService) {}

  @Query(() => Object)
  @Allow(Permission.ReadCatalog, Permission.Public)
  async brands(
    @Ctx() ctx: RequestContext,
    @Arg('options', () => String, { nullable: true }) options: string | null,
  ): Promise<{ items: Brand[]; totalItems: number }> {
    const parsedOptions = options ? JSON.parse(options) : undefined;
    return this.brandService.findAll(ctx, parsedOptions);
  }

  @Query(() => Brand, { nullable: true })
  @Allow(Permission.ReadCatalog, Permission.Public)
  async brand(
    @Ctx() ctx: RequestContext,
    @Arg('id') id: string,
  ): Promise<Brand | null> {
    return this.brandService.findOne(ctx, id);
  }

  @Query(() => Brand, { nullable: true })
  @Allow(Permission.ReadCatalog, Permission.Public)
  async brandBySlug(
    @Ctx() ctx: RequestContext,
    @Arg('slug') slug: string,
  ): Promise<Brand | null> {
    return this.brandService.findBySlug(ctx, slug);
  }

  @Mutation(() => Brand)
  @Allow(Permission.UpdateCatalog)
  async createBrand(
    @Ctx() ctx: RequestContext,
    @Arg('input', () => String) input: string,
  ): Promise<Brand> {
    const parsedInput = JSON.parse(input);
    return this.brandService.create(ctx, parsedInput);
  }

  @Mutation(() => Brand)
  @Allow(Permission.UpdateCatalog)
  async updateBrand(
    @Ctx() ctx: RequestContext,
    @Arg('input', () => String) input: string,
  ): Promise<Brand> {
    const parsedInput = JSON.parse(input);
    return this.brandService.update(ctx, parsedInput.id, parsedInput);
  }

  @Mutation(() => Boolean)
  @Allow(Permission.DeleteCatalog)
  async deleteBrand(
    @Ctx() ctx: RequestContext,
    @Arg('id') id: string,
  ): Promise<boolean> {
    return this.brandService.delete(ctx, id);
  }
}

// Product.brand field resolver is handled via GraphQL schema extension
// The field is resolved by accessing product.customFields.brandId and fetching the brand

