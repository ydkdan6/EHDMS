import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { PatientRecords } from './PatientRecords';
import { LocationMap } from './LocationMap';
import { toast } from 'react-hot-toast';

export const HospitalDashboard: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState<any>(null);

  const { data: pendingCases } = useQuery({
    queryKey: ['pending-cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emergency_cases')
        .select(`
          *
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching pending cases:', error);
        throw error;
      }
      return data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const handleAcceptCase = async (caseId: string) => {
    try {
      const { error } = await supabase
        .from('emergency_cases')
        .update({
          status: 'in_progress',
          assigned_hospital_id: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', caseId);

      if (error) throw error;
      toast.success('Emergency case accepted');
    } catch (error: any) {
      console.error('Error accepting case:', error);
      toast.error('Failed to accept case: ' + error.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Pending Emergency Cases</h3>
        <div className="space-y-4">
          {pendingCases?.map((case_) => (
            <div key={case_.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className={`px-2 py-1 rounded text-sm ${
                    case_.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    case_.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    case_.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {case_.severity}
                  </span>
                  <h4 className="mt-2 font-medium">
                    Patient: {case_.patientName || 'Unknown'}
                  </h4>
                  <p className="mt-1 text-gray-600">{case_.description}</p>
                  {case_.vitalSigns && (
                    <div className="mt-2 text-sm">
                      <p>BP: {case_.vitalSigns.bloodPressure}</p>
                      <p>HR: {case_.vitalSigns.heartRate} bpm</p>
                      <p>Temp: {case_.vitalSigns.temperature}°C</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedCase(case_)}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleAcceptCase(case_.id)}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                  >
                    Accept
                  </button>
                </div>
              </div>
              
              {selectedCase?.id === case_.id && case_.location && (
                <div className="mt-4">
                  <h5 className="font-medium mb-2">Location</h5>
                  <LocationMap location={case_.location} />
                </div>
              )}
            </div>
          ))}
          {(!pendingCases || pendingCases.length === 0) && (
            <p className="text-gray-500">No pending emergency cases</p>
          )}
        </div>
      </div>

      <PatientRecords />
    </div>
  );
};