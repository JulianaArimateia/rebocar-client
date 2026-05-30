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

// Uma mesma pessoa pode ter conta de cliente E de motorista com o mesmo e-mail.
// Se o e-mail já existe no Firebase Auth (ex: já cadastrado como motorista),
// fazemos login com as credenciais fornecidas e criamos/atualizamos o perfil de cliente.
export const registerClient = async (
  name: string,
  email: string,
  phone: string,
  password: string
): Promise<User> => {
  let uid: string;
  let isExistingAccount = false;

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    uid = credential.user.uid;
  } catch (e: any) {
    if (e.code === 'auth/email-already-in-use') {
      // E-mail já existe — pode ser um motorista querendo usar como cliente.
      // Tentamos login com a mesma senha para confirmar identidade.
      try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        uid = credential.user.uid;
        isExistingAccount = true;
      } catch {
        throw new Error(
          'Este e-mail já está cadastrado. Se você é motorista parceiro, use a mesma senha da conta de motorista para criar sua conta de cliente.'
        );
      }
    } else {
      throw e;
    }
  }

  // Verifica se já tem perfil de cliente
  const existingSnap = await getDoc(doc(db, 'users', uid));
  if (existingSnap.exists()) {
    const existing = existingSnap.data();
    if (existing.type === 'client' || existing.type === 'both') {
      // Já tem conta de cliente — não recria, só faz login
      if (isExistingAccount) {
        return existing as User;
      }
      throw new Error('Este e-mail já está cadastrado como cliente. Faça login.');
    }
    // Era somente motorista — adiciona papel de cliente
    await setDoc(doc(db, 'users', uid), {
      ...existing,
      type: 'both',
      clientName: name || existing.name,
      clientPhone: phone || existing.phone,
      clientTermsAcceptedAt: serverTimestamp(),
    }, { merge: true });
    return { ...existing, type: 'both' } as unknown as User;
  }

  // Novo usuário — cria perfil de cliente
  const user: User = {
    id: uid,
    name,
    email,
    phone,
    type: 'client',
    termsAcceptedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'users', uid), user);
  return user;
};

// Login no app cliente:
// - Funciona para clientes puros
// - Funciona para motoristas que também têm conta de cliente (type: 'both')
// - Se for motorista sem perfil de cliente: cria automaticamente o perfil de cliente
export const loginUser = async (email: string, password: string): Promise<User> => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  const snap = await getDoc(doc(db, 'users', uid));

  if (snap.exists()) {
    return snap.data() as User;
  }

  // Sem perfil em users — pode ser motorista que ainda não criou conta de cliente.
  const driverSnap = await getDoc(doc(db, 'drivers', uid));
  if (driverSnap.exists()) {
    const driverData = driverSnap.data();
    // Cria perfil de cliente automaticamente usando dados do motorista
    const user: User = {
      id: uid,
      name: driverData.name,
      email: driverData.email,
      phone: driverData.phone,
      type: 'both',
      termsAcceptedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', uid), user);
    return user;
  }

  throw new Error('Usuário não encontrado. Verifique seu e-mail e senha.');
};

export const logoutUser = () => signOut(auth);

export const getCurrentUserData = async (uid: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
};
