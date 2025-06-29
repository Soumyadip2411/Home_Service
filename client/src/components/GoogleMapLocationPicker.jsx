import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { toast } from 'react-hot-toast';
import { FiMapPin, FiSearch, FiX } from 'react-icons/fi';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 22.4919552,
  lng: 88.342528
};

const GoogleMapLocationPicker = ({ 
  onLocationSelect, 
  initialLocation = null, 
  showSearchBox = true,
  height = '400px',
  markers = [],
  readOnly = false 
}) => {
  const [map, setMap] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [searchQuery, setSearchQuery] = useState('');
  const [infoWindow, setInfoWindow] = useState(null);
  const [geocoder, setGeocoder] = useState(null);
  const [showFallback, setShowFallback] = useState(false);
  const searchBoxRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY',
    libraries: ['places']
  });

  const onLoad = useCallback((map) => {
    setMap(map);
    
    // Initialize geocoder
    const geocoderInstance = new window.google.maps.Geocoder();
    setGeocoder(geocoderInstance);

    // Set initial location if provided
    if (initialLocation) {
      map.setCenter(initialLocation);
      map.setZoom(15);
    } else {
      // Get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            map.setCenter(userLocation);
            map.setZoom(15);
            setSelectedLocation(userLocation);
            if (onLocationSelect) {
              onLocationSelect(userLocation);
            }
          },
          (error) => {
            console.error('Error getting location:', error);
            map.setCenter(defaultCenter);
            map.setZoom(10);
          }
        );
      } else {
        map.setCenter(defaultCenter);
        map.setZoom(10);
      }
    }
  }, [initialLocation, onLocationSelect]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMapClick = useCallback((event) => {
    if (readOnly) return;
    
    const location = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    
    setSelectedLocation(location);
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  }, [onLocationSelect, readOnly]);

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
        
        setSelectedLocation(newLocation);
        map.setCenter(newLocation);
        map.setZoom(15);
        
        if (onLocationSelect) {
          onLocationSelect(newLocation);
        }
        
        toast.success('Location found!');
      } else {
        toast.error('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Error searching for location');
    }
  }, [searchQuery, geocoder, map, onLocationSelect]);

  const handleMarkerClick = useCallback((marker) => {
    setInfoWindow({
      position: { lat: marker.lat, lng: marker.lng },
      content: marker.title || 'Service Location'
    });
  }, []);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // Simple fallback UI for when maps fail to load
  if (loadError || showFallback) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <div className="text-yellow-500 mr-3">⚠️</div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Map Unavailable</h3>
              <p className="text-yellow-700">Please enter coordinates manually.</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
            <input
              type="number"
              step="any"
              placeholder="Enter latitude"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={(e) => {
                const lat = parseFloat(e.target.value);
                const lng = selectedLocation?.lng || 0;
                if (lat && onLocationSelect) {
                  onLocationSelect({ lat, lng });
                }
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
            <input
              type="number"
              step="any"
              placeholder="Enter longitude"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={(e) => {
                const lng = parseFloat(e.target.value);
                const lat = selectedLocation?.lat || 0;
                if (lng && onLocationSelect) {
                  onLocationSelect({ lat, lng });
                }
              }}
            />
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>To fix this:</strong> Add a valid Google Maps API key to your .env file:
          </p>
          <code className="block mt-2 p-2 bg-gray-100 rounded text-sm">
            VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
          </code>
        </div>
      </div>
    );
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
      {showSearchBox && (
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
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
      )}

      <div className="relative">
        <GoogleMap
          mapContainerStyle={{ ...containerStyle, height }}
          center={selectedLocation || defaultCenter}
          zoom={15}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
          }}
        >
          {/* Selected location marker */}
          {selectedLocation && (
            <Marker
              position={selectedLocation}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#3B82F6"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(24, 24),
                anchor: new window.google.maps.Point(12, 12)
              }}
            />
          )}

          {/* Service markers */}
          {markers.map((marker, index) => (
            <Marker
              key={index}
              position={{ lat: marker.lat, lng: marker.lng }}
              onClick={() => handleMarkerClick(marker)}
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
          ))}

          {/* Info window */}
          {infoWindow && (
            <InfoWindow
              position={infoWindow.position}
              onCloseClick={() => setInfoWindow(null)}
            >
              <div className="p-2">
                <h3 className="font-semibold text-sm">{infoWindow.content}</h3>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {selectedLocation && !readOnly && (
          <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border">
            <div className="flex items-center space-x-2">
              <FiMapPin className="text-blue-600" />
              <div className="text-sm">
                <p className="font-medium">Selected Location</p>
                <p className="text-gray-600">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedLocation(null);
                  if (onLocationSelect) onLocationSelect(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedLocation && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <FiMapPin className="text-blue-600" />
            <span className="font-medium text-blue-900">Location Details</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Latitude:</span>
              <span className="ml-2 font-mono">{selectedLocation.lat.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-gray-600">Longitude:</span>
              <span className="ml-2 font-mono">{selectedLocation.lng.toFixed(6)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapLocationPicker; 