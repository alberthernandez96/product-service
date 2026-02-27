import { Pool } from 'pg';
import { PostgresBaseRepository } from '@albertoficial/postgres-shared';
import type { ProductRecord } from './ProductRecord';

export class ProductRepository extends PostgresBaseRepository<ProductRecord> {
  protected tableName = 'products';
  protected idColumn: keyof ProductRecord & string = 'id';
  protected columns: (keyof ProductRecord & string)[] = ['id', 'name', 'availability', 'price', 'quantity'];

  constructor(pool: Pool) {
    super(pool);
  }

  async list(limit: number, offset: number): Promise<{ rows: ProductRecord[]; total: number }> {
    const countResult = await this.pool.query(
      `SELECT COUNT(*)::int AS total FROM ${this.tableName}`
    );
    const total = (countResult.rows[0] as { total: number }).total;
    const cols = this.columns.join(', ');
    const result = await this.pool.query(
      `SELECT ${cols} FROM ${this.tableName} ORDER BY name ASC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const rows = result.rows as ProductRecord[];
    return { rows, total };
  }
}
