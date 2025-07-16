import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import { FaCamera, FaSpinner, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const SearchByFaceModal = ({ isOpen, onClose, onCapture, loading, error, onProviderName }) => {
  const webcamRef = useRef(null);
  const [captured, setCaptured] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [success, setSuccess] = useState(false);

  const handleCapture = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    setCaptured(true);
    setFeedback("Searching for provider...");
    onCapture(imageSrc, handleProviderResult);
  };

  // Called by parent when provider is found
  const handleProviderResult = (providerName) => {
    if (providerName) {
      setSuccess(true);
      setFeedback(`Provider found: ${providerName}`);
      setTimeout(() => {
        if (onProviderName) onProviderName(providerName);
        onClose();
      }, 1200);
    }
  };

  React.useEffect(() => {
    if (!isOpen) {
      setCaptured(false);
      setFeedback("");
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="backdrop-blur-lg bg-gradient-to-br from-cyan-900/80 via-blue-900/60 to-black/90 border-2 border-cyan-400/60 rounded-3xl shadow-2xl p-6 flex flex-col items-center w-[95vw] max-w-sm relative animate-fade-in" style={{boxShadow: '0 0 32px 6px #22d3ee55'}}>
        <h2 className="text-2xl font-extrabold mb-2 text-cyan-300 drop-shadow-lg tracking-widest font-[Orbitron,monospace] uppercase select-none">Search Provider by Face</h2>
        <div className="mb-3 text-lg text-center font-semibold text-cyan-200 flex items-center justify-center gap-2 min-h-[32px] transition-all duration-300">
          {loading && <FaSpinner className="animate-spin text-cyan-400" />}
          {success && <FaCheckCircle className="text-green-400 animate-bounce" />}
          {error && <FaTimesCircle className="text-red-400 animate-pulse" />}
          <span className="transition-all duration-300">{feedback || error || "Show the provider's face to the camera"}</span>
        </div>
        <div className="relative mb-4">
          {/* Webcam with animated glow */}
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
            <div className="w-[340px] h-[260px] rounded-3xl animate-glow border-2 border-cyan-400/40" style={{boxShadow: '0 0 60px 10px #22d3ee44, 0 0 0 4px #0ea5e944 inset'}}></div>
          </div>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={320}
            height={240}
            videoConstraints={{ facingMode: "user" }}
            className="rounded-2xl border-4 border-cyan-400 shadow-xl relative z-0 bg-black/80"
          />
          <style>{`
            .animate-fade-in {
              animation: fadeIn 0.7s cubic-bezier(.4,0,.2,1);
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
            .animate-glow {
              animation: glowPulse 2.2s ease-in-out infinite alternate;
            }
            @keyframes glowPulse {
              0% { box-shadow: 0 0 60px 10px #22d3ee44, 0 0 0 4px #0ea5e944 inset; }
              100% { box-shadow: 0 0 90px 20px #22d3ee77, 0 0 0 8px #0ea5e977 inset; }
            }
          `}</style>
        </div>
        <button
          className="mt-2 px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold shadow hover:from-pink-600 hover:to-cyan-600 transition-all tracking-wider flex items-center gap-2"
          onClick={handleCapture}
          disabled={loading || captured}
        >
          <FaCamera /> Capture
        </button>
        <button
          className="mt-2 px-6 py-2 rounded-lg bg-gradient-to-r from-gray-500 to-gray-700 text-white font-semibold shadow hover:from-gray-600 hover:to-gray-800 transition-all tracking-wider"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default SearchByFaceModal; 