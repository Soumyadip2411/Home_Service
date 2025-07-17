import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import {
  FaCamera,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import Axios from "../utils/Axios";

const TIMEOUT_SECONDS = 10;

const SearchByFaceModal = ({ isOpen, onClose, onProviderName }) => {
  const webcamRef = useRef(null);
  const intervalRef = useRef(null);
  const captureIntervalRef = useRef(null);
  const inFlight = useRef(false);

  const [sessionId, setSessionId] = useState(null);
  const [timer, setTimer] = useState(TIMEOUT_SECONDS);
  const [feedback, setFeedback] = useState(
    "Align the provider's face in the scanner and click Capture"
  );
  const [status, setStatus] = useState("idle"); // idle | loading | capturing | success | error
  const [provider, setProvider] = useState(null);
  const [capturing, setCapturing] = useState(false);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setSessionId(null);
      setTimer(TIMEOUT_SECONDS);
      setFeedback("Align the provider's face in the scanner and click Capture");
      setStatus("idle");
      setProvider(null);
      setCapturing(false);
    }

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(captureIntervalRef.current);
    };
  }, [isOpen]);

  // Timer + capture flow
  useEffect(() => {
    if (capturing && sessionId && status === "capturing") {
      setTimer(TIMEOUT_SECONDS);

      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            clearInterval(captureIntervalRef.current);
            setFeedback("Timed out. Please try again.");
            setStatus("error");
            setTimeout(() => handleClose(), 1500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      captureIntervalRef.current = setInterval(() => {
        handleAutoCapture();
      }, 1000);
    }

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(captureIntervalRef.current);
    };
  }, [capturing, sessionId, status]);

  const handleClose = async () => {
    clearInterval(intervalRef.current);
    clearInterval(captureIntervalRef.current);

    setCapturing(false);
    setTimer(TIMEOUT_SECONDS);

    if (sessionId) {
      const endForm = new FormData();
      endForm.append("sessionId", sessionId);
      try {
        await Axios.post("/api/face/end-session", endForm, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch (e) {
        console.error("Failed to end session", e);
      }
    }

    setSessionId(null);
    setStatus("idle");
    setProvider(null);
    setCapturing(false);
    onClose();
  };

  const startCapture = async () => {
    setFeedback("Starting face session...");
    setStatus("loading");
    try {
      const res = await Axios.post("/api/face/start-session");
      setSessionId(res.data.sessionId);
      setStatus("capturing");
      setCapturing(true);
      setFeedback("Scanning for provider...");
    } catch {
      setStatus("error");
      setFeedback("Failed to start face session.");
    }
  };

  const handleAutoCapture = async () => {
    if (!webcamRef.current || !sessionId || status !== "capturing" || inFlight.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    inFlight.current = true;
    setFeedback("Scanning for provider...");

    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();

      const formData = new FormData();
      formData.append("file", blob, "frame.jpg");
      formData.append("sessionId", sessionId);

      const response = await Axios.post("/api/face/search-provider", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success && response.data.provider) {
        setStatus("success");
        setProvider(response.data.provider);
        setFeedback(`Provider found: ${response.data.provider.name || response.data.provider.email}`);
        if (onProviderName)
          onProviderName(response.data.provider.name || response.data.provider.email);

        clearInterval(intervalRef.current);
        clearInterval(captureIntervalRef.current);
        setTimeout(() => handleClose(), 1500);
      } else {
        setFeedback("No match found. Keep your face in frame.");
      }
    } catch (err) {
      console.error("Face detection error:", err);
      setFeedback("Temporary error. Retrying...");
      // Don't stop the session
    } finally {
      inFlight.current = false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="backdrop-blur-lg bg-gradient-to-br from-cyan-900/80 via-blue-900/60 to-black/90 border-2 border-cyan-400/60 rounded-3xl shadow-2xl p-6 flex flex-col items-center w-[95vw] max-w-sm relative animate-fade-in"
        style={{ boxShadow: '0 0 32px 6px #22d3ee55' }}>

        <h2 className="text-2xl font-extrabold mb-2 text-cyan-300 drop-shadow-lg tracking-widest font-[Orbitron,monospace] uppercase select-none">
          Search Provider by Face
        </h2>

        <div className="mb-3 text-lg text-center font-semibold text-cyan-200 flex items-center justify-center gap-2 min-h-[32px] transition-all duration-300">
          {status === "loading" && <FaSpinner className="animate-spin text-cyan-400" />}
          {status === "success" && <FaCheckCircle className="text-green-400 animate-bounce" />}
          {status === "error" && <FaTimesCircle className="text-red-400 animate-pulse" />}
          <span className="transition-all duration-300">{feedback}</span>
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
            <div className="w-[340px] h-[260px] rounded-3xl animate-glow border-2 border-cyan-400/40"
              style={{
                boxShadow: '0 0 60px 10px #22d3ee44, 0 0 0 4px #0ea5e944 inset'
              }}></div>
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
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-400 via-blue-400 to-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((TIMEOUT_SECONDS - timer) / TIMEOUT_SECONDS) * 100}%` }}
          ></div>
        </div>

        {status === "idle" && (
          <button
            className="mt-2 px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold shadow hover:from-pink-600 hover:to-cyan-600 transition-all tracking-wider flex items-center gap-2"
            onClick={startCapture}
            disabled={capturing}
          >
            <FaCamera /> Capture
          </button>
        )}

        <button
          className="mt-2 px-6 py-2 rounded-lg bg-gradient-to-r from-gray-500 to-gray-700 text-white font-semibold shadow hover:from-gray-600 hover:to-gray-800 transition-all tracking-wider"
          onClick={handleClose}
          disabled={status === "loading"}
        >
          Cancel
        </button>

        {/* Styles */}
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
    </div>
  );
};

export default SearchByFaceModal;
