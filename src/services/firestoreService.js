import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

// TODO: adjust collection names/structure as needed

export async function addCustomer(agentId, customer) {
  const col = collection(db, 'agents', agentId, 'customers');
  const docRef = await addDoc(col, customer);
  return docRef.id;
}

export async function getCustomers(agentId) {
  const col = collection(db, 'agents', agentId, 'customers');
  const snapshot = await getDocs(col);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addWorkLog(agentId, log) {
  const col = collection(db, 'agents', agentId, 'workLogs');
  const docRef = await addDoc(col, log);
  return docRef.id;
}

export async function getWorkLogs(agentId, options = {}) {
  let q = collection(db, 'agents', agentId, 'workLogs');
  // example option: { orderBy: 'date' }
  if (options.orderBy) {
    q = query(q, orderBy(options.orderBy, options.direction || 'asc'));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateCustomer(agentId, customerId, updates) {
  const ref = doc(db, 'agents', agentId, 'customers', customerId);
  await updateDoc(ref, updates);
}

export async function deleteCustomer(agentId, customerId) {
  const ref = doc(db, 'agents', agentId, 'customers', customerId);
  await deleteDoc(ref);
}
