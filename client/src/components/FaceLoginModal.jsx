import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import Axios from "../utils/Axios";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setUserDetails } from "../store/userSlice";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";

const FaceLoginModal = ({ isOpen, onClose }) => {
  const webcamRef = useRef(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [timer, setTimer] = useState(10); // seconds
  const [feedback, setFeedback] = useState("Align your face in the scanner");
  const [faceDetected, setFaceDetected] = useState(null); // null, true, false
  const [loading, setLoading] = useState(false);
  const [showTick, setShowTick] = useState(false); // Only show tick once
  const [sessionId, setSessionId] = useState(null);
  const intervalRef = useRef();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Start session when modal opens
  useEffect(() => {
    if (isOpen) {
      Axios.post("/api/face/start-session")
        .then(res => setSessionId(res.data.sessionId))
        .catch(() => setFeedback("Failed to start face session."));
    } else {
      setSessionId(null);
    }
  }, [isOpen]);

  // Stable capture function
  const captureAndVerify = async () => {
    if (!webcamRef.current || !sessionId) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    setLoading(true);
    setFeedback("Scanning...");
    // Convert base64 to blob
    const res = await fetch(imageSrc);
    const blob = await res.blob();
    const formData = new FormData();
    formData.append("file", blob, "frame.jpg");
    formData.append("sessionId", sessionId);
    try {
      const response = await Axios.post("/api/face/verify-frame", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setLoading(false);
      if (response.data.success) {
        setFaceDetected(true);
        setFeedback("Face Detected! Logging in...");
        setShowTick(true); // Show tick only once
        localStorage.setItem("accesstoken", response.data.accesstoken);
        localStorage.setItem("refreshToken", response.data.refreshToken);
        dispatch(setUserDetails(response.data.user));
        setTimeout(async () => {
          clearInterval(intervalRef.current);
          setIsVerifying(false);
          setShowTick(false);
          if (sessionId) {
            try {
              const formData = new FormData();
              formData.append("sessionId", sessionId);
              await Axios.post("/api/face/end-session", formData, {
                headers: { "Content-Type": "multipart/form-data" },
              });
            } catch (e) {}
          }
          onClose();
          navigate("/");
        }, 1400);
      } else {
        setFaceDetected(false);
        setFeedback("Face not recognized. Try again or use password.");
      }
    } catch (err) {
      setLoading(false);
      setFaceDetected(false);
      setFeedback("No face detected. Align your face in the scanner.");
    }
  };

  // End session and close modal
  const handleClose = async () => {
    setIsVerifying(false);
    clearInterval(intervalRef.current);
    setShowTick(false);
    if (sessionId) {
      try {
        const formData = new FormData();
        formData.append("sessionId", sessionId);
        await Axios.post("/api/face/end-session", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch (e) {
        // Optionally log or toast error
      }
    }
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setIsVerifying(true);
      setTimer(10);
      setFeedback("Align your face in the scanner");
      setFaceDetected(null);
      setLoading(false);
      setShowTick(false);
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsVerifying(false);
            setFeedback("Face not recognized. Try again or use password.");
            handleClose();
            return 0;
          }
          return prev - 1;
        });
        captureAndVerify();
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }
    // eslint-disable-next-line
  }, [isOpen, sessionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="backdrop-blur-lg bg-gradient-to-br from-cyan-900/60 via-blue-900/40 to-black/80 border-2 border-cyan-400/60 rounded-3xl shadow-2xl p-8 flex flex-col items-center w-full max-w-md relative animate-fade-in" style={{boxShadow: '0 0 40px 8px #22d3ee55'}}>
        <h2 className="text-3xl font-extrabold mb-2 text-cyan-300 drop-shadow-lg tracking-widest font-[Orbitron,monospace] uppercase select-none">Face Scanner</h2>
        <div className="mb-3 text-lg text-center font-semibold text-cyan-200 flex items-center justify-center gap-2 min-h-[32px] transition-all duration-300">
          {loading && <FaSpinner className="animate-spin text-cyan-400" />}
          {showTick && <FaCheckCircle className="text-green-400 animate-bounce" />}
          {faceDetected === false && <FaTimesCircle className="text-red-400 animate-pulse" />}
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
            className="rounded-2xl border-4 border-cyan-400 shadow-xl relative z-0 bg-black/80"
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
          onClick={handleClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default FaceLoginModal; 