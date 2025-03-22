import axios from 'axios';

const LOCATIONIQ_API_KEY = import.meta.env.VITE_LOCATIONIQ_API_KEY;
const BASE_URL = 'https://us1.locationiq.com/v1';

interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
}

export const searchLocation = async (query: string): Promise<GeocodingResult[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/search.php`, {
      params: {
        key: LOCATIONIQ_API_KEY,
        q: query,
        format: 'json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('LocationIQ search error:', error);
    throw new Error('Failed to search location');
  }
};

export const reverseGeocode = async (lat: number, lon: number): Promise<GeocodingResult> => {
  try {
    const response = await axios.get(`${BASE_URL}/reverse.php`, {
      params: {
        key: LOCATIONIQ_API_KEY,
        lat,
        lon,
        format: 'json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('LocationIQ reverse geocoding error:', error);
    throw new Error('Failed to get address from coordinates');
  }
};