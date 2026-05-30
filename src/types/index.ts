export type UserType = 'client' | 'driver';

export type TowServiceType = 'car' | 'truck' | 'munck';

export const TOW_SERVICE_LABELS: Record<TowServiceType, string> = {
  car: 'Guincho para Carro',
  truck: 'Guincho para Caminhão',
  munck: 'Caminhão Munck',
};

export const TOW_SERVICE_PRICES: Record<TowServiceType, number> = {
  car: 145,
  truck: 280,
  munck: 420,
};

export type RequestStatus =
  | 'waiting'
  | 'accepted'
  | 'on_the_way'
  | 'arrived'
  | 'completed'
  | 'cancelled';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: UserType;
  photoUrl?: string;
  createdAt: any;
}

export interface Driver extends User {
  cnh: string;
  vehicleModel: string;
  vehiclePlate: string;
  serviceTypes: TowServiceType[];
  status: 'available' | 'busy' | 'offline';
  location?: Location;
  rating: number;
  totalServices: number;
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  clientName: string;
  driverId?: string;
  status: RequestStatus;
  serviceType: TowServiceType;
  vehicleModel: string;
  vehiclePlate: string;
  problemDescription: string;
  photoUrl?: string;
  clientLocation: Location;
  destinationAddress?: string;
  estimatedPrice?: number;
  createdAt: any;
  acceptedAt?: any;
  completedAt?: any;
}

export interface Evaluation {
  id: string;
  requestId: string;
  clientId: string;
  driverId: string;
  rating: number;
  comment?: string;
  tags?: string[];
  createdAt: any;
}

export type PaymentStatus = 'pending_client' | 'client_confirmed' | 'driver_confirmed' | 'disputed';

export interface Payment {
  id: string;
  requestId: string;
  clientId: string;
  driverId: string;
  amount: number;
  serviceType: TowServiceType;
  pixKey: string;
  pixKeyType: string;
  status: PaymentStatus;
  createdAt: any;
  clientConfirmedAt?: any;
  driverConfirmedAt?: any;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Profile: undefined;
  Alerts: undefined;
  ReportIncident: undefined;
  Waiting: { requestId: string };
  Tracking: { requestId: string };
  Payment: { requestId: string; driverId: string; driverName: string; serviceType: TowServiceType; amount: number };
  Rating: { requestId: string; driverId: string; driverName: string; serviceType: TowServiceType };
  History: undefined;
  Legal: { type: 'terms' | 'privacy' };
};
