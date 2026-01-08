import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/types/collections';
import { Item, ItemType, ItemStatus } from '@/types/item';
import { NotFoundError, ValidationError } from '@/lib/utils/errors';

/**
 * Get item by ID
 */
export const getItemById = async (itemId: string): Promise<Item> => {
  const itemRef = doc(db, COLLECTIONS.ITEMS, itemId);
  const itemSnap = await getDoc(itemRef);
  
  if (!itemSnap.exists()) {
    throw new NotFoundError('Item');
  }
  
  return { id: itemSnap.id, ...itemSnap.data() } as Item;
};

/**
 * Get item by slug
 */
export const getItemBySlug = async (slug: string): Promise<Item | null> => {
  const itemsRef = collection(db, COLLECTIONS.ITEMS);
  const q = query(itemsRef, where('slug', '==', slug), limit(1));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const doc = querySnapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Item;
};

/**
 * Get all items with filters
 */
export const getItems = async (options?: {
  type?: ItemType;
  status?: ItemStatus;
  categoryId?: string;
  businessId?: string;
  limit?: number;
  lastDocId?: string;
  featured?: boolean;
}): Promise<{ items: Item[]; lastDocId?: string; hasMore: boolean }> => {
  const itemsRef = collection(db, COLLECTIONS.ITEMS);
  let q = query(itemsRef);
  
  // Filter by businessId if provided
  if (options?.businessId) {
    q = query(q, where('businessId', '==', options.businessId));
  }
  
  if (options?.type) {
    q = query(q, where('type', '==', options.type));
  }
  
  if (options?.status) {
    q = query(q, where('status', '==', options.status));
  }
  
  if (options?.categoryId) {
    q = query(q, where('categoryIds', 'array-contains', options.categoryId));
  }
  
  if (options?.featured !== undefined) {
    q = query(q, where('isFeatured', '==', options.featured));
  }
  
  q = query(q, orderBy('createdAt', 'desc'));
  
  if (options?.limit) {
    q = query(q, limit(options.limit));
  }
  
  const querySnapshot = await getDocs(q);
  const items = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Item[];
  
  const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
  const hasMore = querySnapshot.docs.length === (options?.limit || 10);
  
  return {
    items,
    lastDocId: lastDoc?.id,
    hasMore
  };
};

export const getServices = async (): Promise<Item[]> => {
  const itemsRef = collection(db, COLLECTIONS.ITEMS);
  const q = query(itemsRef, where('type', '==', 'service'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Item[];
};

export const getProducts = async (): Promise<Item[]> => {
  const itemsRef = collection(db, COLLECTIONS.ITEMS);
  const q = query(itemsRef, where('type', '==', 'product'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Item[];
};

/**
 * Get items by IDs
 */
export const getItemsByIds = async (itemIds: string[]): Promise<Item[]> => {
  if (!itemIds || itemIds.length === 0) {
    return [];
  }
  
  // Fetch items individually using getDoc (Firestore doesn't support __name__ in queries)
  const items: Item[] = [];
  for (const id of itemIds) {
    try {
      const itemRef = doc(db, COLLECTIONS.ITEMS, id);
      const itemSnap = await getDoc(itemRef);
      if (itemSnap.exists()) {
        items.push({ id: itemSnap.id, ...itemSnap.data() } as Item);
      }
    } catch (error) {
      console.error(`Error fetching item ${id}:`, error);
    }
  }
  
  // Maintain the order of itemIds
  const itemsMap = new Map(items.map(item => [item.id, item]));
  return itemIds.map(id => itemsMap.get(id)).filter((item): item is Item => item !== undefined);
};


/**
 * Create item
 */
export const createItem = async (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  if (!item.name || !item.slug || !item.type) {
    throw new ValidationError('Name, slug, and type are required');
  }
  
  // Check if slug already exists
  const existingItem = await getItemBySlug(item.slug);
  if (existingItem) {
    throw new ValidationError('Item with this slug already exists');
  }
  
  // Automatically get businessId if not provided
  let businessId = item.businessId;
  if (!businessId) {
    const { getBusinessId } = await import('@/lib/businesses/utils');
    businessId = await getBusinessId();
  }
  
  const itemData: Omit<Item, 'id'> = {
    ...item,
    businessId,
    createdAt: serverTimestamp() as unknown as Timestamp,
    updatedAt: serverTimestamp() as unknown as Timestamp,
  };
  
  const itemRef = await addDoc(collection(db, COLLECTIONS.ITEMS), itemData);
  return itemRef.id;
};

/**
 * Update item
 */
export const updateItem = async (itemId: string, updates: Partial<Item>): Promise<void> => {
  const itemRef = doc(db, COLLECTIONS.ITEMS, itemId);
  const itemSnap = await getDoc(itemRef);
  
  if (!itemSnap.exists()) {
    throw new NotFoundError('Item');
  }
  
  // If slug is being updated, check for conflicts
  if (updates.slug) {
    const existingItem = await getItemBySlug(updates.slug);
    if (existingItem && existingItem.id !== itemId) {
      throw new ValidationError('Item with this slug already exists');
    }
  }
  
  await updateDoc(itemRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Delete item
 */
export const deleteItem = async (itemId: string): Promise<void> => {
  const itemRef = doc(db, COLLECTIONS.ITEMS, itemId);
  const itemSnap = await getDoc(itemRef);
  
  if (!itemSnap.exists()) {
    throw new NotFoundError('Item');
  }
  
  await deleteDoc(itemRef);
};

