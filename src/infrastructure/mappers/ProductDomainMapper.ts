import type { ProductEntity } from '@application';
import type { ProductRecord } from '../database';

export class ProductDomainMapper {
  static fromDatabase(record: ProductRecord): ProductEntity {
    return {
      id: record.id,
      name: record.name,
      availability: record.availability,
      price: Number(record.price),
      quantity: Number(record.quantity),
    };
  }
}
