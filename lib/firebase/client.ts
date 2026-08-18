import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection } from 'firebase/firestore';
import { firebaseConfig } from './config';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

// Collection helpers
export const productsCol = collection(db, 'products');
export const categoriesCol = collection(db, 'categories');
export const inventoryTransactionsCol = collection(db, 'inventoryTransactions');
export const customersCol = collection(db, 'customers');
export const leadsCol = collection(db, 'leads');
export const quotationsCol = collection(db, 'quotations');
export const settingsCol = collection(db, 'settings');
export const usersCol = collection(db, 'users');
