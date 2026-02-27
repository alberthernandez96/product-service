export interface ProductEntity {
  id: string;
  name: string;
  availability: boolean;
  price: number;
  quantity: number;
}

export interface IProductRepository {
  list(limit: number, offset: number): Promise<{ items: ProductEntity[]; total: number }>;
}
