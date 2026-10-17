import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot,
  query,
  limit,
  where
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Real-time subscription to any Firestore collection
 * @param {string} collectionName
 * @param {function} onData Callback with array of items
 * @param {function} onError Callback for errors
 * @returns {function} Unsubscribe function
 */
export const subscribeCollection = (collectionName, onData, onError) => {
  try {
    const colRef = collection(db, collectionName);
    return onSnapshot(
      colRef, 
      (snapshot) => {
        const items = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        onData(items);
      },
      (error) => {
        console.warn(`Firestore subscription notice for [${collectionName}]:`, error.message);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.error(`Error setting up listener on ${collectionName}:`, err);
    if (onError) onError(err);
    return () => {};
  }
};

/**
 * Save or update a single document in Firestore
 */
export const saveFirestoreDoc = async (collectionName, docId, data) => {
  try {
    if (!docId) throw new Error('Document ID is required');
    const docRef = doc(db, collectionName, String(docId));
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error(`Failed to save document in ${collectionName}/${docId}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a document from Firestore
 */
export const deleteFirestoreDoc = async (collectionName, docId) => {
  try {
    if (!docId) throw new Error('Document ID is required');
    const docRef = doc(db, collectionName, String(docId));
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete document in ${collectionName}/${docId}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if a Firestore collection has any documents
 */
export const isCollectionEmpty = async (collectionName) => {
  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef, limit(1));
    const snapshot = await getDocs(q);
    return snapshot.empty;
  } catch (error) {
    console.warn(`Could not check empty status for ${collectionName}:`, error.message);
    return false;
  }
};

/**
 * Seed initial data to Firestore if the collection is empty
 */
export const seedCollectionIfEmpty = async (collectionName, initialItems) => {
  try {
    const empty = await isCollectionEmpty(collectionName);
    if (empty && Array.isArray(initialItems) && initialItems.length > 0) {
      console.log(`Seeding initial data to Firestore collection: ${collectionName}...`);
      for (const item of initialItems) {
        if (item && item.id) {
          const docRef = doc(db, collectionName, String(item.id));
          await setDoc(docRef, item, { merge: true });
        }
      }
      console.log(`Seeding complete for ${collectionName}.`);
    }
  } catch (err) {
    console.warn(`Seeding skipped or encountered error on ${collectionName}:`, err.message);
  }
};

/**
 * Find an employee document in Firestore by email address
 * @param {string} email
 * @returns {Promise<object|null>}
 */
export const findEmployeeByEmail = async (email) => {
  if (!email) return null;
  const cleanEmail = String(email).trim().toLowerCase();

  // 1. Try querying Cloud Firestore
  try {
    const colRef = collection(db, 'employees');
    const q = query(colRef, where('email', '==', cleanEmail), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() };
    }
  } catch (err) {
    console.warn('Firestore query notice for employee by email (falling back to local cache):', err.message);
  }

  // 2. Fallback to localStorage cache
  try {
    const saved = localStorage.getItem('setu_crm_employees');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const found = parsed.find(e => e.email && e.email.trim().toLowerCase() === cleanEmail);
        if (found) return found;
      }
    }
  } catch (e) {}

  return null;
};
