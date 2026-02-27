import { Pool } from 'pg';
import { IDatabaseConnection } from '@albertoficial/backend-shared';
import { ProductRepository, PRODUCT_SCHEMA } from './Product';
import { seedProducts } from './seed';

export class PostgresConnection implements IDatabaseConnection {
  private pool: Pool | null = null;
  private adminPool: Pool | null = null;

  private getAdminPool(): Pool {
    if (!this.adminPool) {
      const host = process.env.DB_HOST;
      const port = parseInt(process.env.DB_PORT || '5432', 10);
      const user = process.env.DB_USER;
      const password = process.env.DB_PASSWORD;

      if (!host || !user || !password) {
        throw new Error('DB_HOST, DB_USER, and DB_PASSWORD are required for admin operations');
      }

      this.adminPool = new Pool({
        host,
        port,
        user,
        password,
        database: 'postgres',
      });
    }
    return this.adminPool;
  }

  private async ensureDatabaseExists(dbName: string): Promise<void> {
    const adminPool = this.getAdminPool();
    const client = await adminPool.connect();

    try {
      const result = await client.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [dbName]
      );

      if (result.rowCount === 0) {
        console.log(`Creating database '${dbName}'...`);
        await client.query(`CREATE DATABASE "${dbName}"`);
        console.log(`Database '${dbName}' created`);
      }
    } catch (error) {
      console.error('Error ensuring database exists:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to ensure database exists: ${message}`);
    } finally {
      client.release();
    }
  }

  private async runMigrations(): Promise<void> {
    if (!this.pool) {
      throw new Error('Pool not initialized');
    }
    await this.pool.query(PRODUCT_SCHEMA);
    console.log('Database migrations executed successfully');
  }

  public getClient(): Pool {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  public async initialize(): Promise<void> {
    const dbName = process.env.DB_NAME || 'product-service';
    await this.ensureDatabaseExists(dbName);

    const password = encodeURIComponent(process.env.DB_PASSWORD ?? '');
    const connectionString = `postgresql://${process.env.DB_USER}:${password}@${process.env.DB_HOST}:${process.env.DB_PORT}/${dbName}`;
    this.pool = new Pool({
      connectionString,
      max: parseInt(process.env.DB_POOL_MAX ?? '20', 10),
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT ?? '30000', 10),
      connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT ?? '2000', 10),
    });

    await this.pool.query('SELECT 1');
    console.log('PostgreSQL connected');

    await this.runMigrations();
    await this.seedDatabase();
  }

  private async seedDatabase(): Promise<void> {
    try {
      await seedProducts(this.getClient());
    } catch (error) {
      console.error('Error seeding database:', error);
      // Don't throw - seeding is optional
    }
  }

  public async shutdown(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    if (this.adminPool) {
      await this.adminPool.end();
      this.adminPool = null;
    }
    console.log('PostgreSQL disconnected');
  }

  public getRepositories(): { product: ProductRepository } {
    return {
      product: new ProductRepository(this.getClient()),
    };
  }
}
