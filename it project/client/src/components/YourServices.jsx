import React, { useEffect, useState } from "react";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import { toast } from "react-hot-toast";

const YourServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProviderServices = async () => {
    try {
      const response = await Axios({
        url: "/api/service/", 
        method: "get",
      });

      if (response.data.success) {
        setServices(response.data.data);
      } else {
        toast.error("Failed to load services");
      }
    } catch (error) {
      console.error("Error loading services:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderServices();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Your Services</h2>

      {loading ? (
        <p>Loading...</p>
      ) : services.length === 0 ? (
        <p>You have not added any services yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div key={service._id} className="border p-4 rounded shadow-sm bg-white">
              <h3 className="font-bold text-lg">{service.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{service.description}</p>
              <p className="text-sm">
                <strong>Price:</strong> ₹{service.price}
              </p>
              <p className="text-sm">
                <strong>Duration:</strong> {service.duration}
              </p>
              <p className="text-sm">
                <strong>Category:</strong> {service.category?.name || "N/A"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                <strong>Location:</strong> {service.location?.coordinates?.[1]}, {service.location?.coordinates?.[0]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default YourServices;
