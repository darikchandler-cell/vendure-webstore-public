import { TransactionalConnection, RequestContext, ListQueryBuilder } from '@vendure/core';
import { Brand } from './entities/brand.entity';

export interface BrandListOptions {
  skip?: number;
  take?: number;
  sort?: any;
  filter?: any;
}

export class BrandService {
  constructor(
    private connection: TransactionalConnection,
    private listQueryBuilder: ListQueryBuilder,
  ) {}

  async findAll(ctx: RequestContext, options?: BrandListOptions) {
    const qb = this.connection
      .getRepository(ctx, Brand)
      .createQueryBuilder('brand');

    if (options?.skip) {
      qb.skip(options.skip);
    }
    if (options?.take) {
      qb.take(options.take);
    }
    if (options?.sort) {
      Object.entries(options.sort).forEach(([key, value]) => {
        qb.addOrderBy(`brand.${key}`, value === 'ASC' ? 'ASC' : 'DESC');
      });
    }
    if (options?.filter) {
      if (options.filter.name?.contains) {
        qb.andWhere('brand.name ILIKE :name', { name: `%${options.filter.name.contains}%` });
      }
      if (options.filter.slug?.eq) {
        qb.andWhere('brand.slug = :slug', { slug: options.filter.slug.eq });
      }
    }

    const [items, totalItems] = await qb.getManyAndCount();
    return { items, totalItems };
  }

  async findOne(ctx: RequestContext, id: string): Promise<Brand | null> {
    return this.connection.getRepository(ctx, Brand).findOne({
      where: { id },
    });
  }

  async findBySlug(ctx: RequestContext, slug: string): Promise<Brand | null> {
    return this.connection.getRepository(ctx, Brand).findOne({
      where: { slug },
    });
  }

  async create(ctx: RequestContext, input: {
    name: string;
    slug?: string;
    description?: string;
    logoAssetId?: string;
    websiteUrl?: string;
  }): Promise<Brand> {
    const brand = this.connection.getRepository(ctx, Brand).create({
      name: input.name,
      slug: input.slug || this.slugify(input.name),
      description: input.description,
      logoAssetId: input.logoAssetId,
      websiteUrl: input.websiteUrl,
    });
    return this.connection.getRepository(ctx, Brand).save(brand);
  }

  async update(ctx: RequestContext, id: string, input: {
    name?: string;
    slug?: string;
    description?: string;
    logoAssetId?: string;
    websiteUrl?: string;
  }): Promise<Brand> {
    const brand = await this.findOne(ctx, id);
    if (!brand) {
      throw new Error(`Brand with id ${id} not found`);
    }

    if (input.name !== undefined) brand.name = input.name;
    if (input.slug !== undefined) brand.slug = input.slug;
    if (input.description !== undefined) brand.description = input.description;
    if (input.logoAssetId !== undefined) brand.logoAssetId = input.logoAssetId;
    if (input.websiteUrl !== undefined) brand.websiteUrl = input.websiteUrl;

    return this.connection.getRepository(ctx, Brand).save(brand);
  }

  async delete(ctx: RequestContext, id: string): Promise<boolean> {
    const result = await this.connection.getRepository(ctx, Brand).delete(id);
    return (result.affected || 0) > 0;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

