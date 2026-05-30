import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

export const forgotPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email.trim());
};

export const requestDataDeletion = async (uid: string, reason?: string): Promise<void> => {
  await addDoc(collection(db, 'deletionRequests'), {
    userId: uid,
    reason: reason || 'Solicitação do usuário',
    status: 'pending',
    createdAt: serverTimestamp(),
  });
};

export const registerClient = async (
  name: string,
  email: string,
  phone: string,
  password: string
): Promise<User> => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user: User = {
    id: credential.user.uid,
    name,
    email,
    phone,
    type: 'client',
    termsAcceptedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'users', credential.user.uid), user);
  return user;
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, 'users', credential.user.uid));
  if (!snap.exists()) throw new Error('Usuário não encontrado.');
  return snap.data() as User;
};

export const logoutUser = () => signOut(auth);

export const getCurrentUserData = async (uid: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
};
