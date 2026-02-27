import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

interface ProductJson {
  id: string;
  title: string;
  price?: string | number | null;
  [key: string]: unknown;
}

interface ProductsJson {
  products: ProductJson[];
}

export async function seedProducts(pool: Pool): Promise<void> {
  // Check if table is empty
  const countResult = await pool.query('SELECT COUNT(*)::int AS total FROM products');
  const total = (countResult.rows[0] as { total: number }).total;

  if (total > 0) {
    console.log(`Products table already has ${total} records. Skipping seed.`);
    return;
  }

  // Read JSON file - try multiple possible paths
  const possiblePaths = [
    path.join(__dirname, '../scripts/products.json'), // Relative to compiled dist folder
    path.join(process.cwd(), 'src/infrastructure/database/scripts/products.json'), // From project root
    path.join(__dirname, '../../scripts/products.json'), // Alternative relative path
  ];

  let jsonPath: string | null = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      jsonPath = possiblePath;
      break;
    }
  }

  if (!jsonPath) {
    console.warn(`Seed file not found. Tried paths: ${possiblePaths.join(', ')}. Skipping seed.`);
    return;
  }

  const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
  const data: ProductsJson = JSON.parse(jsonContent);

  // Transform products: id -> uuid, title -> name, availability -> true, price, quantity default 1
  const products = data.products.map((product) => {
    const priceRaw = product.price;
    const price =
      priceRaw !== null && priceRaw !== undefined && priceRaw !== ''
        ? Number(String(priceRaw).replace(/[^0-9.-]+/g, '')) || 0
        : 0;
    return {
      id: product.id,
      name: product.title,
      availability: true,
      price,
      quantity: 1,
    };
  });

  // Insert products in batches
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const values: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    for (const product of batch) {
      values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`);
      params.push(product.id, product.name, product.availability, product.price, product.quantity);
      paramIndex += 5;
    }

    const query = `
      INSERT INTO products (id, name, availability, price, quantity)
      VALUES ${values.join(', ')}
      ON CONFLICT (id) DO NOTHING
    `;

    await pool.query(query, params);
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${products.length} products...`);
  }

  console.log(`Successfully seeded ${inserted} products.`);
}
