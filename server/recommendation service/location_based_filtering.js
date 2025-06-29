import Service from "../models/service.model.js";

const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRadians(lat1)) * 
      Math.cos(toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in kilometers
  };
  
  const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
  };

  export const getLocationRecommendations = async (lat, lng, maxDistance = 50) => {
    return Service.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: "distance",
          maxDistance: maxDistance * 1000, // Convert km to meters
          spherical: true
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          distance: { $divide: ["$distance", 1000] }
        }
      },
      { $sort: { distance: 1 } }
    ]);
  };