export type UserType = 'client' | 'driver';

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

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  ReportIncident: undefined;
  Waiting: { requestId: string };
  Tracking: { requestId: string };
  Rating: { requestId: string; driverId: string; driverName: string };
  History: undefined;
};
