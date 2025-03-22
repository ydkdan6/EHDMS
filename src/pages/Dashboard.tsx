import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { EmergencyCase, Hospital, EmergencyResponder } from '../types';
import { LocationMap } from '../components/LocationMap';
import { EmergencyForm } from '../components/EmergencyForm';
import { HospitalDashboard } from '@/components/HospitalDashboard';
import { VerificationCodes } from '@/components/VerificationCodes';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  const { data: emergencyCases } = useQuery({
    queryKey: ['emergencyCases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emergency_cases')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EmergencyCase[];
    },
  });

  const renderDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Admin Dashboard</h2>
            <VerificationCodes />
          </div>
        );

      case 'patient':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">My Emergency Cases</h2>
            <div className="grid gap-6">
              {emergencyCases?.filter(c => c.patientId === user.id).map(emergency => (
                <div key={emergency.id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`px-2 py-1 rounded text-sm ${
                        emergency.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        emergency.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        emergency.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {emergency.severity}
                      </span>
                      <p className="mt-2 text-gray-600">{emergency.description}</p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(emergency.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {emergency.location && (
                    <div className="mt-4">
                      <LocationMap location={emergency.location} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'responder':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Emergency Responder Dashboard</h2>
            <EmergencyForm />
          </div>
        );

      case 'hospital':
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold">Hospital Dashboard</h2>
            <HospitalDashboard />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderDashboard()}
      </div>
    </div>
  );
};