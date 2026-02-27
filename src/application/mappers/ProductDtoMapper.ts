import type { ProductDTO } from '@albertoficial/api-contracts';
import type { ProductEntity } from '../repositories/IProductRepository';

export class ProductDtoMapper {
  static toDto(entity: ProductEntity): ProductDTO {
    return {
      id: entity.id,
      name: entity.name,
      availability: entity.availability,
      price: entity.price,
      quantity: entity.quantity,
    } as ProductDTO;
  }
}
