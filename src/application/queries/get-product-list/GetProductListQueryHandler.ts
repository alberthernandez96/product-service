import { QueryHandler } from '@albertoficial/backend-shared';
import { ProductDtoMapper, GetProductListQuery, IProductRepository } from '@application';

export class GetProductListQueryHandler implements QueryHandler<GetProductListQuery, unknown> {
  constructor(private readonly productRepository: IProductRepository) {}

  async handle(query: GetProductListQuery): Promise<unknown> {
    return query.executeWithTracing(async (qry) => {
      const { items, total } = await this.productRepository.list(
        qry.limit,
        (qry.page - 1) * qry.limit
      );
      const productItems = items.map((p) => ProductDtoMapper.toDto(p));
      const totalPages = Math.ceil(total / qry.limit) || 1;

      return {
        items: productItems,
        total,
        page: qry.page,
        limit: qry.limit,
        totalPages,
      };
    });
  }
}
