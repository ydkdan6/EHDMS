import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { notificationService } from '../lib/notifications';
// import { LocationMap } from './LocationMap';

interface EmergencyFormData {
  patientName: string;
  age: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    address: string;
  };
  gender: 'male' | 'female';
  symptoms: string;
  vitalSigns: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
  };
}

export const EmergencyForm: React.FC = () => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EmergencyFormData>();
  const location = watch('location');

  const onSubmit = async (data: EmergencyFormData) => {
    try {
      // Create emergency case
      const { data: emergencyCase, error: emergencyError } = await supabase
        .from('emergency_cases')
        .insert([{
          ...data,
          status: 'pending'
        }])
        .select()
        .single();

      if (emergencyError) throw emergencyError;

      // Send notification to hospitals
      await notificationService.sendNotification('emergency_alert', {
        emergencyCase,
        message: `New emergency case: ${data.severity} severity - ${data.description}`
      });

      toast.success('Emergency alert sent to nearby hospitals');
    } catch (error) {
      console.error('Error submitting emergency:', error);
      toast.error('Failed to submit emergency case');
    }
  };

  const handleLocationSelect = (newLocation: { latitude: number; longitude: number }) => {
    setValue('location', {
      ...newLocation,
      address: 'Location selected on map'
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Report Emergency</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Patient Name</label>
            <input
              type="text"
              {...register('patientName', { required: 'Patient name is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Age</label>
            <input
              type="number"
              {...register('age', { required: 'Age is required', min: 0 })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Gender</label>
          <select
            {...register('gender', { required: 'Gender is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            {...register('description', { required: 'Description is required' })}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Severity</label>
          <select
            {...register('severity', { required: 'Severity is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Symptoms</label>
          <textarea
            {...register('symptoms', { required: 'Symptoms are required' })}
            rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Blood Pressure</label>
            <input
              type="text"
              {...register('vitalSigns.bloodPressure')}
              placeholder="120/80"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Heart Rate</label>
            <input
              type="number"
              {...register('vitalSigns.heartRate')}
              placeholder="BPM"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Temperature</label>
            <input
              type="number"
              {...register('vitalSigns.temperature')}
              placeholder="°C"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <label className='text-sm'>Address:</label>
          <textarea
            {...register('location', { required: 'Loaction are required' })}
            rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Send Emergency Alert
          </button>
        </div>
      </form>
    </div>
  );
};