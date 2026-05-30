import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { ServiceRequest, Location, TowServiceType, TOW_SERVICE_PRICES } from '../types';

export const uploadVehiclePhoto = async (
  uri: string,
  requestId: string
): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, `vehicles/${requestId}_${Date.now()}.jpg`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
};

export const createRequest = async (
  clientId: string,
  clientName: string,
  serviceType: TowServiceType,
  vehicleModel: string,
  vehiclePlate: string,
  problemDescription: string,
  clientLocation: Location,
  destinationAddress: string,
  photoUri?: string
): Promise<string> => {
  const requestData: Partial<ServiceRequest> = {
    clientId,
    clientName,
    serviceType,
    vehicleModel,
    vehiclePlate,
    problemDescription,
    clientLocation,
    destinationAddress,
    estimatedPrice: TOW_SERVICE_PRICES[serviceType],
    status: 'waiting',
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'requests'), requestData);

  if (photoUri) {
    const photoUrl = await uploadVehiclePhoto(photoUri, docRef.id);
    await updateDoc(docRef, { photoUrl });
  }

  return docRef.id;
};

export const cancelRequest = async (requestId: string): Promise<void> => {
  await updateDoc(doc(db, 'requests', requestId), {
    status: 'cancelled',
    cancelledAt: serverTimestamp(),
  });
};

export const getRequest = async (requestId: string): Promise<ServiceRequest | null> => {
  const snap = await getDoc(doc(db, 'requests', requestId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as ServiceRequest) : null;
};

export const subscribeToRequest = (
  requestId: string,
  callback: (request: ServiceRequest) => void
) => {
  return onSnapshot(doc(db, 'requests', requestId), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as ServiceRequest);
    }
  });
};

export const subscribeToDriverLocation = (
  driverId: string,
  callback: (location: Location) => void
) => {
  return onSnapshot(doc(db, 'drivers', driverId), (snap) => {
    if (snap.exists() && snap.data().location) {
      callback(snap.data().location as Location);
    }
  });
};

export const getClientHistory = async (clientId: string): Promise<ServiceRequest[]> => {
  const q = query(
    collection(db, 'requests'),
    where('clientId', '==', clientId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceRequest));
};

export const submitEvaluation = async (
  requestId: string,
  clientId: string,
  driverId: string,
  rating: number,
  comment: string,
  tags: string[]
): Promise<void> => {
  await addDoc(collection(db, 'evaluations'), {
    requestId,
    clientId,
    driverId,
    rating,
    comment,
    tags,
    createdAt: serverTimestamp(),
  });

  // Update driver average rating
  const evalQuery = query(
    collection(db, 'evaluations'),
    where('driverId', '==', driverId)
  );
  const evalSnap = await getDocs(evalQuery);
  const ratings = evalSnap.docs.map((d) => d.data().rating as number);
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  await updateDoc(doc(db, 'drivers', driverId), { rating: avg });
  await updateDoc(doc(db, 'requests', requestId), { evaluated: true });
};

export const subscribeToPayment = (
  requestId: string,
  callback: (payment: any | null) => void
) => {
  const q = query(
    collection(db, 'payments'),
    where('requestId', '==', requestId)
  );
  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      callback(null);
    } else {
      const d = snap.docs[0];
      callback({ id: d.id, ...d.data() });
    }
  });
};

export const confirmPaymentByClient = async (paymentId: string): Promise<void> => {
  await updateDoc(doc(db, 'payments', paymentId), {
    status: 'client_confirmed',
    clientConfirmedAt: serverTimestamp(),
  });
};

export const haversineDistance = (a: Location, b: Location): number => {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sin1 = Math.sin(dLat / 2);
  const sin2 = Math.sin(dLon / 2);
  const h =
    sin1 * sin1 +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      sin2 *
      sin2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};
