import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export const VerificationCodes: React.FC = () => {
  const [newCode, setNewCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<'hospital' | 'responder'>('hospital');
  const queryClient = useQueryClient();

  const { data: codes } = useQuery({
    queryKey: ['verification-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verification_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createCode = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('verification_codes')
        .insert([{
          code: newCode,
          role: selectedRole,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-codes'] });
      setNewCode('');
      toast.success('Verification code created successfully');
    },
    onError: () => {
      toast.error('Failed to create verification code');
    },
  });

  const deleteCode = useMutation({
    mutationFn: async (codeId: string) => {
      const { error } = await supabase
        .from('verification_codes')
        .delete()
        .eq('id', codeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-codes'] });
      toast.success('Verification code deleted');
    },
    onError: () => {
      toast.error('Failed to delete verification code');
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Create Verification Code</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="Enter verification code"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as 'hospital' | 'responder')}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="hospital">Hospital Staff</option>
            <option value="responder">Emergency Responder</option>
          </select>
          <button
            onClick={() => createCode.mutate()}
            disabled={!newCode}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Create Code
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {codes?.map((code) => (
              <tr key={code.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {code.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {code.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(code.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => deleteCode.mutate(code.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};