import type { IProductRepository, ProductEntity } from '@application';
import { ProductRepository } from '../database';
import { ProductDomainMapper } from '../mappers';

export class ProductRepositoryAdapter implements IProductRepository {
  constructor(private readonly postgresRepo: ProductRepository) {}

  async list(limit: number, offset: number): Promise<{ items: ProductEntity[]; total: number }> {
    const { rows, total } = await this.postgresRepo.list(limit, offset);
    return {
      items: rows.map((r) => ProductDomainMapper.fromDatabase(r)),
      total,
    };
  }
}
