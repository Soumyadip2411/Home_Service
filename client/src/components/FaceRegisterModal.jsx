import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import Axios from "../utils/Axios";
import { useSelector, useDispatch } from "react-redux";
import { setUserDetails } from "../store/userSlice";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";

const ANGLES = [
  "Front",
  "Left",
  "Right",
  "Up",
  "Down"
];
const MIN_IMAGES = 3;
const MAX_IMAGES = 5;

const FaceRegisterModal = ({ isOpen, onClose }) => {
  const webcamRef = useRef(null);
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const [captures, setCaptures] = useState([]); // array of blobs
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [failure, setFailure] = useState(false);

  if (!isOpen) return null;

  const handleCapture = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    const res = await fetch(imageSrc);
    const blob = await res.blob();
    setCaptures(prev => {
      const updated = [...prev];
      updated[currentStep] = blob;
      return updated;
    });
    if (currentStep < MAX_IMAGES - 1) setCurrentStep(currentStep + 1);
  };

  const handleRetake = (idx) => {
    setCurrentStep(idx);
  };

  const handleRegister = async () => {
    setLoading(true);
    setMsg("");
    setSuccess(false);
    setFailure(false);
    const formData = new FormData();
    formData.append("userId", user._id);
    captures.slice(0, MAX_IMAGES).forEach((blob, idx) => {
      if (blob) formData.append("files", blob, `face_angle_${idx}.jpg`);
    });
    try {
      const response = await Axios.post("/api/face/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMsg(response.data.msg || "Registration successful!");
      setSuccess(true);
      dispatch(setUserDetails({ ...user, faceRegistered: true }));
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      setMsg(err.response?.data?.msg || "Registration failed.");
      setFailure(true);
      setTimeout(() => setFailure(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCaptures([]);
    setCurrentStep(0);
    setMsg("");
    setSuccess(false);
    setFailure(false);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="backdrop-blur-lg bg-gradient-to-br from-cyan-900/60 via-blue-900/40 to-black/80 border-2 border-cyan-400/60 rounded-3xl shadow-2xl p-4 sm:p-8 flex flex-col items-center w-full max-w-md sm:max-w-md md:max-w-lg relative animate-fade-in mx-2 mb-8" style={{boxShadow: '0 0 40px 8px #22d3ee55'}}>
        <h2 className="text-xl sm:text-2xl font-extrabold mb-2 text-cyan-300 drop-shadow-lg tracking-widest font-[Orbitron,monospace] uppercase select-none text-center">Register Face (Different Angles)</h2>
        <div className="mb-3 text-base sm:text-lg text-center font-semibold text-cyan-200 flex items-center justify-center gap-2 min-h-[32px] transition-all duration-300">
          {loading && <FaSpinner className="animate-spin text-cyan-400" />}
          {success && <FaCheckCircle className="text-green-400 animate-bounce" />}
          {failure && <FaTimesCircle className="text-red-400 animate-pulse" />}
          <span className="transition-all duration-300">{msg || `Step ${currentStep + 1} of ${MAX_IMAGES}: ${ANGLES[currentStep]}`}</span>
        </div>
        <div className="relative mb-4 w-full flex justify-center">
          {/* Grid background */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 320 240" className="w-full h-full">
              <defs>
                <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#22d3ee22" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="320" height="240" fill="url(#grid)" />
            </svg>
          </div>
          {/* Animated oval and scan line overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <svg width="320" height="240" className="absolute">
              <defs>
                <radialGradient id="ovalGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="60%" stopColor="#22d3ee" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.2" />
                </radialGradient>
                <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <ellipse
                cx="160"
                cy="120"
                rx="110"
                ry="80"
                fill="none"
                stroke="url(#ovalGlow)"
                strokeWidth="5"
                filter="url(#glow2)"
                className="animate-pulse"
              />
              {/* Animated scan line */}
              <rect
                x="70"
                y="0"
                width="180"
                height="6"
                fill="#22d3ee"
                opacity="0.85"
                className="scanline"
                style={{ filter: 'drop-shadow(0 0 12px #22d3ee)' }}
              />
            </svg>
          </div>
          {/* Soft animated glow around webcam feed */}
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
            <div className="w-[90vw] max-w-[340px] h-[55vw] max-h-[260px] rounded-3xl animate-glow border-2 border-cyan-400/40" style={{boxShadow: '0 0 60px 10px #22d3ee44, 0 0 0 4px #0ea5e944 inset'}}></div>
          </div>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={320}
            height={240}
            videoConstraints={{ facingMode: "user" }}
            className="rounded-2xl border-4 border-cyan-400 shadow-xl relative z-0 bg-black/80 transform scale-x-[-1] animate-fade-in w-[90vw] max-w-[320px] h-[55vw] max-h-[240px]"
          />
          {/* Scan line animation */}
          <style>{`
            .scanline {
              animation: scan-move 1.2s linear infinite alternate;
            }
            @keyframes scan-move {
              0% { y: 10; }
              100% { y: 210; }
            }
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
        <div className="flex gap-2 mb-4 flex-wrap justify-center w-full">
          {Array.from({ length: MAX_IMAGES }).map((_, idx) =>
            captures[idx] ? (
              <img
                key={idx}
                src={URL.createObjectURL(captures[idx])}
                alt={`angle-${idx}`}
                width={60}
                height={60}
                className={`rounded shadow cursor-pointer ${idx === currentStep ? 'ring-2 ring-cyan-400' : ''}`}
                onClick={() => handleRetake(idx)}
                title={`Retake ${ANGLES[idx]}`}
              />
            ) : (
              <div key={idx} className={`w-[60px] h-[60px] rounded bg-cyan-900/40 flex items-center justify-center text-cyan-400 border-2 border-cyan-400/20 cursor-pointer ${idx === currentStep ? 'ring-2 ring-cyan-400' : ''}`}>{ANGLES[idx][0]}</div>
            )
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full justify-center items-center mt-2 mb-4 sm:mb-0">
          <button
            className="w-full sm:w-auto px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold shadow hover:from-pink-600 hover:to-cyan-600 transition-all tracking-wider"
            onClick={handleCapture}
            disabled={loading}
          >
            {captures[currentStep] ? "Retake" : "Capture"}
          </button>
          {captures.filter(Boolean).length >= MIN_IMAGES && (
            <button
              className="w-full sm:w-auto px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-700 text-white font-semibold shadow hover:from-blue-600 hover:to-cyan-800 transition-all tracking-wider"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          )}
          <button
            className="w-full sm:w-auto px-6 py-2 rounded-lg bg-gradient-to-r from-gray-500 to-gray-700 text-white font-semibold shadow hover:from-gray-600 hover:to-gray-800 transition-all tracking-wider"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaceRegisterModal; 