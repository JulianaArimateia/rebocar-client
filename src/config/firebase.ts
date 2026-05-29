import { initializeApp } from 'firebase/app';
import { initializeAuth, Persistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyClHUvgkKe2GNcXXqUCQNQxReAsKqQLck4",
  authDomain: "rebocar-379f9.firebaseapp.com",
  databaseURL: "https://rebocar-379f9-default-rtdb.firebaseio.com",
  projectId: "rebocar-379f9",
  storageBucket: "rebocar-379f9.firebasestorage.app",
  messagingSenderId: "1019154398388",
  appId: "1:1019154398388:web:cfadc9b4bbc4c0e93e6be1",
  measurementId: "G-KBRQNHW00K"
};

const app = initializeApp(firebaseConfig);

// getReactNativePersistence lives in the RN-specific bundle resolved by Metro at runtime
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getReactNativePersistence } = require('@firebase/auth/dist/rn/index.js') as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
