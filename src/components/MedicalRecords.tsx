import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

export const MedicalRecords: React.FC = () => {
  const { user } = useAuthStore();

  const { data: records } = useQuery({
    queryKey: ['medical-records', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Medical Records
          </h3>
        </div>
        <div className="border-t border-gray-200">
          {records?.map((record) => (
            <div
              key={record.id}
              className="px-4 py-5 sm:px-6 border-b border-gray-200 last:border-b-0"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {record.record_type}
                  </h4>
                  <div className="mt-2 text-sm text-gray-500">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(record.details, null, 2)}
                    </pre>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(record.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
          {(!records || records.length === 0) && (
            <div className="px-4 py-5 sm:px-6 text-sm text-gray-500">
              No medical records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};