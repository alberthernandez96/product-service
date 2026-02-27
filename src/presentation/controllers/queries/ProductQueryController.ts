import { Request, Response } from 'express';
import {
  ProductListResponseDTO,
  getProductListQuerySchema,
} from '@albertoficial/api-contracts';
import { QueryBus } from '@albertoficial/backend-shared';
import { GetProductListQuery } from '@application';
import { ErrorHandler } from '@presentation';

export class ProductQueryController {
  constructor(private readonly queryBus: QueryBus) {}

  async getAll(req: Request, res: Response<ProductListResponseDTO>): Promise<void> {
    try {
      const { page, limit } = getProductListQuerySchema.parse(req.query);
      const result = await this.queryBus.execute<ProductListResponseDTO>(
        new GetProductListQuery(page, limit, req.headers['x-correlation-id'] as string)
      );
      res.status(200).json(result);
    } catch (error: unknown) {
      ErrorHandler.handle(error, res, 'ProductQueryController.getAll');
    }
  }
}
