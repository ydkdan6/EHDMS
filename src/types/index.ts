export type UserRole = 'patient' | 'responder' | 'hospital' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  created_at: string;
}

export interface EmergencyCase {
  id: string;
  patientId: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  assignedHospitalId?: string;
  assignedResponderId?: string;
  created_at: string;
  updated_at: string;
}

export interface Hospital {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  capacity: {
    total: number;
    available: number;
  };
  resources: {
    ventilators: number;
    icuBeds: number;
  };
  specialties: string[];
}

export interface EmergencyResponder {
  id: string;
  userId: string;
  vehicleId: string;
  status: 'available' | 'assigned' | 'busy';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  lastUpdate: string;
}

export interface VerificationCode {
  id: string;
  code: string;
  role: 'hospital' | 'responder';
  created_at: string;
  created_by?: string;
}