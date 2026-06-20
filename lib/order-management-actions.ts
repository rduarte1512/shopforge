'use server';

import { revalidatePath } from 'next/cache';

export async function updateOrderDetailsAction(id: string, data: any) {
  try {
    const { sql } = await import('@vercel/postgres');

    if (!id) {
      return { success: false, error: 'Encomenda inválida.' };
    }

    const { rows } = await sql`
      UPDATE orders
      SET
        customer_name = ${data.customer_name},
        customer_email = ${data.customer_email},
        status = ${data.status},
        total = ${Number(data.total) || 0},
        subtotal = ${Number(data.subtotal) || 0},
        shipping_cost = ${Number(data.shipping_cost) || 0},
        discount_amount = ${Number(data.discount_amount) || 0},
        payment_method_type = ${data.payment_method_type || null},
        payment_instructions = ${data.payment_instructions || null}
      WHERE id = ${id}
      RETURNING *
    `;

    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/customers');
    return { success: true, order: rows[0] };
  } catch (error) {
    console.error('Error updating order details:', error);
    return { success: false, error: 'Não foi possível editar a encomenda.' };
  }
}

export async function removeOrderAction(id: string) {
  try {
    const { sql } = await import('@vercel/postgres');

    if (!id) {
      return { success: false, error: 'Encomenda inválida.' };
    }

    await sql`DELETE FROM order_items WHERE order_id = ${id}`;
    await sql`DELETE FROM orders WHERE id = ${id}`;

    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error) {
    console.error('Error removing order:', error);
    return { success: false, error: 'Não foi possível eliminar a encomenda.' };
  }
}

export async function updateCustomerDetailsAction(storeId: string, originalEmail: string, data: any) {
  try {
    const { sql } = await import('@vercel/postgres');

    if (!storeId || !originalEmail) {
      return { success: false, error: 'Cliente inválido.' };
    }

    await sql`
      UPDATE orders
      SET
        customer_name = ${data.name},
        customer_email = ${data.email}
      WHERE store_id = ${storeId}
      AND LOWER(customer_email) = LOWER(${originalEmail})
    `;

    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error) {
    console.error('Error updating customer details:', error);
    return { success: false, error: 'Não foi possível editar o cliente.' };
  }
}

export async function removeCustomerAction(storeId: string, email: string) {
  try {
    const { sql } = await import('@vercel/postgres');

    if (!storeId || !email) {
      return { success: false, error: 'Cliente inválido.' };
    }

    await sql`
      DELETE FROM order_items
      WHERE order_id IN (
        SELECT id FROM orders
        WHERE store_id = ${storeId}
        AND LOWER(customer_email) = LOWER(${email})
      )
    `;

    await sql`
      DELETE FROM orders
      WHERE store_id = ${storeId}
      AND LOWER(customer_email) = LOWER(${email})
    `;

    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error) {
    console.error('Error removing customer:', error);
    return { success: false, error: 'Não foi possível eliminar o cliente.' };
  }
}
