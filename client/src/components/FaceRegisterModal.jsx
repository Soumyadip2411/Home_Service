import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import Axios from "../utils/Axios";
import { useSelector, useDispatch } from "react-redux";
import { setUserDetails } from "../store/userSlice";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";

const FaceRegisterModal = ({ isOpen, onClose }) => {
  const webcamRef = useRef(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [timer, setTimer] = useState(10); // seconds
  const intervalRef = useRef();
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const isUpdate = user && user.faceRegistered === true;
  const [feedback, setFeedback] = useState("Align your face in the scanner");
  const [success, setSuccess] = useState(false);
  const [failure, setFailure] = useState(false);

  // Stable capture function
  const captureAndRegister = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    // Convert base64 to blob
    const res = await fetch(imageSrc);
    const blob = await res.blob();
    const formData = new FormData();
    formData.append("file", blob, "frame.jpg");
    formData.append("userId", user._id);
    try {
      const response = await Axios.post("/api/face/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        setSuccess(true);
        setFeedback(isUpdate ? "Biometry updated!" : "Face registered successfully!");
        clearInterval(intervalRef.current);
        setIsRegistering(false);
        dispatch(setUserDetails({ ...user, faceRegistered: true }));
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1200);
      }
    } catch (err) {
      // Ignore errors until timeout
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsRegistering(true);
      setTimer(10);
      setFeedback("Align your face in the scanner");
      setSuccess(false);
      setFailure(false);
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRegistering(false);
            setFailure(true);
            setFeedback("Face not detected. Try again.");
            setTimeout(() => {
              setFailure(false);
              onClose();
            }, 1200);
            return 0;
          }
          return prev - 1;
        });
        captureAndRegister();
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }
    // eslint-disable-next-line
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="backdrop-blur-lg bg-gradient-to-br from-cyan-900/60 via-blue-900/40 to-black/80 border-2 border-cyan-400/60 rounded-3xl shadow-2xl p-8 flex flex-col items-center w-full max-w-md relative animate-fade-in" style={{boxShadow: '0 0 40px 8px #22d3ee55'}}>
        <h2 className="text-2xl font-extrabold mb-2 text-cyan-300 drop-shadow-lg tracking-widest font-[Orbitron,monospace] uppercase select-none">{isUpdate ? "Update Biometry" : "Register Face"}</h2>
        <div className="mb-3 text-lg text-center font-semibold text-cyan-200 flex items-center justify-center gap-2 min-h-[32px] transition-all duration-300">
          {isRegistering && <FaSpinner className="animate-spin text-cyan-400" />}
          {success && <FaCheckCircle className="text-green-400 animate-bounce" />}
          {failure && <FaTimesCircle className="text-red-400 animate-pulse" />}
          <span className="transition-all duration-300">{feedback}</span>
        </div>
        <div className="relative mb-4">
          {/* Grid background */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <svg width="320" height="240" className="w-full h-full">
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
            <div className="w-[340px] h-[260px] rounded-3xl animate-glow border-2 border-cyan-400/40" style={{boxShadow: '0 0 60px 10px #22d3ee44, 0 0 0 4px #0ea5e944 inset'}}></div>
          </div>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={320}
            height={240}
            videoConstraints={{ facingMode: "user" }}
            className="rounded-2xl border-4 border-cyan-400 shadow-xl relative z-0 bg-black/80 "
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
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-400 via-blue-400 to-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((10 - timer) / 10) * 100}%` }}
          ></div>
        </div>
        <button
          className="mt-2 px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold shadow hover:from-pink-600 hover:to-cyan-600 transition-all tracking-wider"
          onClick={() => {
            setIsRegistering(false);
            clearInterval(intervalRef.current);
            setSuccess(false);
            setFailure(false);
            onClose();
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default FaceRegisterModal; 