'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { 
  createProfile, 
  getStores, 
  createStore,
  deleteStore,
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getProducts,
  getOrders,
  updateOrderStatus
} from './db';
import { revalidatePath } from 'next/cache';

// PROFILE ACTIONS
export async function syncUserAction() {
  const user = await currentUser();
  if (!user) return null;

  const email = user.emailAddresses[0]?.emailAddress;
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || email;
  
  try {
    const profile = await createProfile(user.id, email, name);
    return profile;
  } catch (error) {
    console.error('Error syncing user:', error);
    return null;
  }
}

// STORE ACTIONS
export async function getMyStoresAction() {
  const { userId } = await auth();
  if (!userId) return [];
  try {
    return await getStores(userId);
  } catch (error) {
    console.error('Error getting stores:', error);
    return [];
  }
}

export async function createStoreAction(formData: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    const store = await createStore({
      ...formData,
      user_id: userId
    });
    revalidatePath('/dashboard/stores');
    return store;
  } catch (error) {
    console.error('Error creating store:', error);
    throw error;
  }
}

export async function deleteStoreAction(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    await deleteStore(id, userId);
    revalidatePath('/dashboard/stores');
    return true;
  } catch (error) {
    console.error('Error deleting store:', error);
    throw error;
  }
}

export async function getStoreOrdersAction(storeId: string, startDate?: string, endDate?: string) {
  try {
    return await getOrders(storeId, startDate, endDate);
  } catch (error) {
    console.error('Error getting orders:', error);
    return [];
  }
}

export async function updateOrderStatusAction(id: string, status: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    const order = await updateOrderStatus(id, status);
    revalidatePath('/dashboard/orders');
    return order;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

// PRODUCT ACTIONS
export async function getStoreProductsAction(storeId: string) {
  try {
    return await getProducts(storeId);
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
}

export async function addProductAction(formData: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    const product = await createProduct(formData);
    revalidatePath('/dashboard/products');
    return product;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
}

export async function updateProductAction(id: string, formData: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    const product = await updateProduct(id, formData);
    revalidatePath('/dashboard/products');
    return product;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

export async function deleteProductAction(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    await deleteProduct(id);
    revalidatePath('/dashboard/products');
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}
