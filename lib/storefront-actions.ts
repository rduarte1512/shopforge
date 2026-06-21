'use server';

import { sql } from '@vercel/postgres';

export async function getStoreByDomainAction(domain: string) {
  try {
    const normalizedDomain = String(domain || '').trim();
    if (!normalizedDomain) return null;

    const { rows } = await sql`
      SELECT *
      FROM stores
      WHERE domain = ${normalizedDomain}
      LIMIT 1
    `;

    return rows[0] ?? null;
  } catch (error) {
    console.error('Error getting store by domain:', error);
    return null;
  }
}

export async function getProductPageDataAction(domain: string, productId: string) {
  try {
    const normalizedDomain = String(domain || '').trim();
    const normalizedProductId = String(productId || '').trim();

    if (!normalizedDomain || !normalizedProductId) {
      return null;
    }

    const { rows } = await sql`
      SELECT
        row_to_json(s) AS store,
        row_to_json(p) AS product
      FROM stores s
      JOIN products p
        ON p.store_id = s.id
      WHERE s.domain = ${normalizedDomain}
      AND p.id = ${normalizedProductId}
      LIMIT 1
    `;

    const result = rows[0];
    if (!result?.store || !result?.product) return null;

    return {
      store: result.store,
      product: result.product,
    };
  } catch (error) {
    console.error('Error getting product page data:', error);
    return null;
  }
}
