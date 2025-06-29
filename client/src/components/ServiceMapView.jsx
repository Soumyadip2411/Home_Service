import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { toast } from 'react-hot-toast';
import { FiMapPin, FiSearch, FiStar, FiDollarSign, FiClock, FiGrid } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Axios from '../utils/Axios';

const containerStyle = {
  width: '100%',
  height: '600px'
};

const defaultCenter = {
  lat: 22.4919552,
  lng: 88.342528
};

const ServiceMapView = ({ services = [], onServiceSelect }) => {
  const [map, setMap] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [geocoder, setGeocoder] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const navigate = useNavigate();

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY',
    libraries: ['places']
  });

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setMapCenter(location);
          
          // Store in localStorage for other components
          localStorage.setItem('userLat', location.lat.toString());
          localStorage.setItem('userLng', location.lng.toString());
        },
        (error) => {
          console.error('Error getting location:', error);
          // Don't show error toast, just use default location
        }
      );
    }
  }, []);

  const onLoad = useCallback((map) => {
    setMap(map);
    
    // Initialize geocoder
    const geocoderInstance = new window.google.maps.Geocoder();
    setGeocoder(geocoderInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !geocoder) return;

    try {
      const result = await geocoder.geocode({ address: searchQuery });
      
      if (result.results.length > 0) {
        const location = result.results[0].geometry.location;
        const newLocation = {
          lat: location.lat(),
          lng: location.lng()
        };
        
        setMapCenter(newLocation);
        map.setCenter(newLocation);
        map.setZoom(12);
        
        toast.success('Location found!');
      } else {
        toast.error('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Error searching for location');
    }
  }, [searchQuery, geocoder, map]);

  const handleMarkerClick = useCallback((service) => {
    setSelectedService(service);
  }, []);

  const handleServiceClick = useCallback(async (serviceId) => {
    try {
      await Axios.post(`/api/interactions/${serviceId}`, {
        interactionType: "view"
      });
      navigate(`/services/${serviceId}`);
    } catch (error) {
      console.error('Failed to track interaction:', error);
      navigate(`/services/${serviceId}`);
    }
  }, [navigate]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${Math.round(distance * 10) / 10} km`;
  };

  // Fallback grid view when map fails
  const FallbackGridView = () => (
    <div className="space-y-4">
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-center">
          <div className="text-yellow-500 mr-3">⚠️</div>
          <div>
            <h3 className="text-lg font-semibold text-yellow-800">Map View Unavailable</h3>
            <p className="text-yellow-700">Showing services in grid view instead.</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => {
          const userLat = parseFloat(localStorage.getItem("userLat"));
          const userLng = parseFloat(localStorage.getItem("userLng"));
          let distanceText = "Distance unavailable";
          
          if (userLat && userLng && service.location?.coordinates) {
            const distance = calculateDistance(
              userLat,
              userLng,
              service.location.coordinates[1],
              service.location.coordinates[0]
            );
            distanceText = formatDistance(distance);
          }

          return (
            <div
              key={service._id}
              className="bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleServiceClick(service._id)}
            >
              <h3 className="font-semibold text-lg mb-2">{service.title}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{service.description}</p>
              
              <div className="space-y-2 mb-3">
                <div className="flex items-center text-sm">
                  <FiDollarSign className="text-green-600 mr-1" />
                  <span className="font-medium">₹{service.price}/hour</span>
                </div>
                <div className="flex items-center text-sm">
                  <FiClock className="text-blue-600 mr-1" />
                  <span>{service.duration}</span>
                </div>
                {service.avgRating && (
                  <div className="flex items-center text-sm">
                    <FiStar className="text-yellow-500 mr-1" />
                    <span>{service.avgRating.toFixed(1)} ({service.reviews?.length || 0} reviews)</span>
                  </div>
                )}
                <div className="flex items-center text-sm">
                  <FiMapPin className="text-red-500 mr-1" />
                  <span>{distanceText}</span>
                </div>
              </div>
              
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                View Details
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (loadError) {
    return <FallbackGridView />;
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search for a location..."
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleSearch}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <FiSearch className="w-4 h-4" />
        </button>
      </div>

      {/* Map */}
      <div className="relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={12}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
          }}
        >
          {/* User location marker */}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="2"/>
                    <circle cx="12" cy="12" r="4" fill="white"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(24, 24),
                anchor: new window.google.maps.Point(12, 12)
              }}
            />
          )}

          {/* Service markers */}
          {services.map((service) => {
            if (!service.location?.coordinates) return null;
            
            const serviceLat = service.location.coordinates[1];
            const serviceLng = service.location.coordinates[0];

            return (
              <Marker
                key={service._id}
                position={{ lat: serviceLat, lng: serviceLng }}
                onClick={() => handleMarkerClick(service)}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#EF4444"/>
                    </svg>
                  `),
                  scaledSize: new window.google.maps.Size(20, 20),
                  anchor: new window.google.maps.Point(10, 10)
                }}
              />
            );
          })}

          {/* Info window */}
          {selectedService && (
            <InfoWindow
              position={{ 
                lat: selectedService.location.coordinates[1], 
                lng: selectedService.location.coordinates[0] 
              }}
              onCloseClick={() => setSelectedService(null)}
            >
              <div className="p-3 max-w-xs">
                <h3 className="font-semibold text-lg mb-2">{selectedService.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {selectedService.description}
                </p>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center text-sm">
                    <FiDollarSign className="text-green-600 mr-1" />
                    <span className="font-medium">₹{selectedService.price}/hour</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FiClock className="text-blue-600 mr-1" />
                    <span>{selectedService.duration}</span>
                  </div>
                  {selectedService.avgRating && (
                    <div className="flex items-center text-sm">
                      <FiStar className="text-yellow-500 mr-1" />
                      <span>{selectedService.avgRating.toFixed(1)} ({selectedService.reviews?.length || 0} reviews)</span>
                    </div>
                  )}
                  {userLocation && (
                    <div className="flex items-center text-sm">
                      <FiMapPin className="text-red-500 mr-1" />
                      <span>{formatDistance(calculateDistance(
                        userLocation.lat, userLocation.lng,
                        selectedService.location.coordinates[1],
                        selectedService.location.coordinates[0]
                      ))} away</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => handleServiceClick(selectedService._id)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  View Details
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Map controls */}
        <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-lg">
          <div className="text-sm text-gray-600">
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
              <span>Your Location</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>Services ({services.length})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceMapView; 