import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface LocationMapProps {
  location: Location;
  onLocationChange?: (location: Location) => void;
  interactive?: boolean;
}

function MapClickHandler({ onLocationChange }: { onLocationChange?: (location: Location) => void }) {
  const map = useMap();

  React.useEffect(() => {
    if (!onLocationChange) return;

    const handleClick = async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onLocationChange({ latitude: lat, longitude: lng });
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onLocationChange]);

  return null;
}

export const LocationMap: React.FC<LocationMapProps> = ({
  location,
  onLocationChange,
  interactive = false,
}) => {
  return (
    <MapContainer
      center={[location.latitude, location.longitude]}
      zoom={13}
      style={{ height: '400px', width: '100%' }}
      className="rounded-lg shadow-md"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[location.latitude, location.longitude]}>
        {location.address && (
          <Popup>
            {location.address}
          </Popup>
        )}
      </Marker>
      {interactive && <MapClickHandler onLocationChange={onLocationChange} />}
    </MapContainer>
  );
};