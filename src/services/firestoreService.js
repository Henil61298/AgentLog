import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";

// TODO: adjust collection names/structure as needed

export async function addCustomer(agentId, customer) {
  const col = collection(db, "agents", agentId, "customers");
  const docRef = await addDoc(col, customer);
  return docRef.id;
}

export async function getCustomers(agentId) {
  const col = collection(db, "agents", agentId, "customers");
  const snapshot = await getDocs(col);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addWorkLog(agentId, log) {
  const col = collection(db, "agents", agentId, "workLogs");
  // ensure remarks field exists to avoid missing property
  const logWithRemarks = { ...log, remarks: log.remarks || "" };
  const docRef = await addDoc(col, logWithRemarks);
  return docRef.id;
}

export async function getWorkLogs(agentId, options = {}) {
  let q = collection(db, "agents", agentId, "workLogs");
  // example option: { orderBy: 'date' }
  if (options.orderBy) {
    q = query(q, orderBy(options.orderBy, options.direction || "asc"));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addInvestmentType(agentId, type) {
  const col = collection(db, "agents", agentId, "investmentTypes");
  const docRef = await addDoc(col, { name: type });
  return docRef.id;
}

export async function getInvestmentTypes(agentId) {
  const col = collection(db, "agents", agentId, "investmentTypes");
  const snapshot = await getDocs(col);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllInvestments(agentId) {
  const col = collection(db, "agents", agentId, "workLogs");
  const snapshot = await getDocs(col);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateCustomer(agentId, customerId, updates) {
  const ref = doc(db, "agents", agentId, "customers", customerId);
  await updateDoc(ref, updates);
}

export async function deleteCustomer(agentId, customerId) {
  const ref = doc(db, "agents", agentId, "customers", customerId);
  await deleteDoc(ref);
}

export async function updateInvestment(agentId, investmentId, updates) {
  const ref = doc(db, "agents", agentId, "workLogs", investmentId);
  await updateDoc(ref, updates);
}

export async function deleteInvestment(agentId, investmentId) {
  const ref = doc(db, "agents", agentId, "workLogs", investmentId);
  await deleteDoc(ref);
}

export async function getUserProfile(agentId) {
  const ref = doc(db, "agents", agentId);
  try {
    const docSnap = await getDoc(ref);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

export async function updateUserProfile(agentId, profile) {
  const ref = doc(db, "agents", agentId);
  await updateDoc(ref, profile);
}

export async function createUserProfile(agentId, profile) {
  const ref = doc(db, "agents", agentId);
  await setDoc(ref, profile);
}
