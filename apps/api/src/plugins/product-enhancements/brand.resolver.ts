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
    @Arg('options', { nullable: true }) options: any,
  ): Promise<{ items: Brand[]; totalItems: number }> {
    return this.brandService.findAll(ctx, options);
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
    @Arg('input') input: any,
  ): Promise<Brand> {
    return this.brandService.create(ctx, input);
  }

  @Mutation(() => Brand)
  @Allow(Permission.UpdateCatalog)
  async updateBrand(
    @Ctx() ctx: RequestContext,
    @Arg('input') input: any,
  ): Promise<Brand> {
    return this.brandService.update(ctx, input.id, input);
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

