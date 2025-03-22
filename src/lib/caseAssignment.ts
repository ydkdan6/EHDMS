import { supabase } from './supabase';
import { EmergencyCase, Hospital, EmergencyResponder } from '../types';

interface Location {
  latitude: number;
  longitude: number;
}

function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371; // Earth's radius in km
  const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
  const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function assignEmergencyCase(emergencyCase: EmergencyCase) {
  try {
    // Get available hospitals
    const { data: hospitals } = await supabase
      .from('hospitals')
      .select('*')
      .gt('capacity->available', 0);

    if (!hospitals?.length) {
      throw new Error('No available hospitals found');
    }

    // Get available responders
    const { data: responders } = await supabase
      .from('emergency_responders')
      .select('*')
      .eq('status', 'available');

    if (!responders?.length) {
      throw new Error('No available responders found');
    }

    // Find nearest hospital with required resources
    const nearestHospital = hospitals.reduce((nearest, hospital) => {
      const distance = calculateDistance(
        emergencyCase.location,
        hospital.location
      );
      return (!nearest || distance < nearest.distance)
        ? { hospital, distance }
        : nearest;
    }, null as { hospital: Hospital; distance: number } | null);

    if (!nearestHospital) {
      throw new Error('Could not find suitable hospital');
    }

    // Find nearest available responder
    const nearestResponder = responders.reduce((nearest, responder) => {
      const distance = calculateDistance(
        emergencyCase.location,
        responder.location
      );
      return (!nearest || distance < nearest.distance)
        ? { responder, distance }
        : nearest;
    }, null as { responder: EmergencyResponder; distance: number } | null);

    if (!nearestResponder) {
      throw new Error('Could not find available responder');
    }

    // Update emergency case with assignments
    const { error: updateError } = await supabase
      .from('emergency_cases')
      .update({
        status: 'assigned',
        assigned_hospital_id: nearestHospital.hospital.id,
        assigned_responder_id: nearestResponder.responder.id,
      })
      .eq('id', emergencyCase.id);

    if (updateError) throw updateError;

    // Update hospital capacity
    const { error: hospitalError } = await supabase
      .from('hospitals')
      .update({
        'capacity': {
          ...nearestHospital.hospital.capacity,
          available: nearestHospital.hospital.capacity.available - 1,
        },
      })
      .eq('id', nearestHospital.hospital.id);

    if (hospitalError) throw hospitalError;

    // Update responder status
    const { error: responderError } = await supabase
      .from('emergency_responders')
      .update({
        status: 'assigned',
      })
      .eq('id', nearestResponder.responder.id);

    if (responderError) throw responderError;

    return {
      hospital: nearestHospital.hospital,
      responder: nearestResponder.responder,
    };
  } catch (error) {
    console.error('Error assigning emergency case:', error);
    throw error;
  }
}