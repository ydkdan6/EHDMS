import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { LocationMap } from '../components/LocationMap';
import { searchLocation, reverseGeocode } from '../lib/locationIQ';

interface EmergencyForm {
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export const EmergencyCase: React.FC = () => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EmergencyForm>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const location = watch('location');

  const handleSearch = async () => {
    try {
      const results = await searchLocation(searchQuery);
      setSearchResults(results);
    } catch (error) {
      toast.error('Failed to search location');
    }
  };

  const handleLocationSelect = async (result: any) => {
    const newLocation = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      address: result.display_name,
    };
    setValue('location', newLocation);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleMapClick = async (newLocation: { latitude: number; longitude: number }) => {
    try {
      const result = await reverseGeocode(newLocation.latitude, newLocation.longitude);
      setValue('location', {
        ...newLocation,
        address: result.display_name,
      });
    } catch (error) {
      toast.error('Failed to get address for selected location');
    }
  };

  const onSubmit = async (data: EmergencyForm) => {
    try {
      const { error } = await supabase
        .from('emergency_cases')
        .insert([
          {
            patient_id: user?.id,
            description: data.description,
            severity: data.severity,
            location: data.location,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      toast.success('Emergency case reported successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to report emergency case');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6">Report Emergency</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            {...register('description', { required: 'Description is required' })}
            rows={4}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.description && (
            <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Severity
          </label>
          <select
            {...register('severity', { required: 'Severity is required' })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Location
          </label>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a location"
              className="flex-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Search
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-2 bg-white shadow-lg rounded-md border">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleLocationSelect(result)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                >
                  {result.display_name}
                </button>
              ))}
            </div>
          )}

          {location && (
            <div className="mt-4">
              <LocationMap
                location={location}
                onLocationChange={handleMapClick}
                interactive={true}
              />
              <input
                type="hidden"
                {...register('location.latitude')}
              />
              <input
                type="hidden"
                {...register('location.longitude')}
              />
              <input
                type="hidden"
                {...register('location.address')}
              />
            </div>
          )}
        </div>

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Report Emergency
          </button>
        </div>
      </form>
    </div>
  );
};