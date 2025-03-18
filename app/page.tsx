// app/page.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import MetricsCard from './components/MetricsCard';
import SignalCombinationSelector from './components/SignalCombinationSelector';
import ChartComponent from './components/ChartComponent';
import usePPGProcessing from './hooks/usePPGProcessing';
import useSignalQuality from './hooks/useSignalQuality';
import useMongoDB from './hooks/useMongoDB';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSampling, setIsSampling] = useState(false); // New state for sampling
  const [isUploading, setIsUploading] = useState(false);
  const [signalCombination, setSignalCombination] = useState('default');
  const [showConfig, setShowConfig] = useState(false);
  const [currentSubject, setCurrentSubject] = useState('');
  const [confirmedSubject, setConfirmedSubject] = useState('');

  // Define refs for video and canvas
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    ppgData,
    valleys,
    heartRate,
    hrv,
    processFrame,
    startCamera,
    stopCamera,
  } = usePPGProcessing(isRecording, signalCombination, videoRef, canvasRef);

  const { signalQuality, qualityConfidence } = useSignalQuality(ppgData);
  
  // Use MongoDB hook with confirmedSubject
  const { isUploading: isMongoUploading, pushDataToMongo: pushToMongo, fetchHistoricalData, historicalData } = useMongoDB(confirmedSubject);

  // Fetch historical data when subject is confirmed
  useEffect(() => {
    if (confirmedSubject) {
      fetchHistoricalData();
    }
  }, [confirmedSubject]);

  // Confirm User Function
  const confirmUser = () => {
    if (currentSubject.trim()) {
      setConfirmedSubject(currentSubject.trim());
    } else {
      alert('Please enter a valid Subject ID.');
    }
  };

  // Start or stop recording
  useEffect(() => {
    if (isRecording) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isRecording]);

  useEffect(() => {
    let animationFrame: number;
    const processFrameLoop = () => {
      if (isRecording) {
        processFrame(); // Call the frame processing function
        animationFrame = requestAnimationFrame(processFrameLoop);
      }
    };
    if (isRecording) {
      processFrameLoop();
    }
    return () => {
      cancelAnimationFrame(animationFrame); // Clean up animation frame on unmount
    };
  }, [isRecording]);

  // Automatically send data every 10 seconds
  // Automatically send data every second when sampling is enabled
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isSampling && ppgData.length > 0) {
      intervalId = setInterval(() => {
        pushDataToMongo();
      }, 10000); // Send data every second
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isSampling, ppgData]);

  const pushDataToMongo = async () => {
    if (isUploading) return; // Prevent overlapping calls

    setIsUploading(true); // Lock the function
    if (ppgData.length === 0) {
      console.warn('No PPG data to send to MongoDB');
      return;
    }
    // Prepare the record data – adjust or add additional fields as needed
    const recordData = {
      subjectId: confirmedSubject, // Add subject ID to the data
      heartRate: {
        bpm: isNaN(heartRate.bpm) ? 0 : heartRate.bpm, // Replace NaN with "ERRATIC"
        confidence: hrv.confidence || 0,
      },
      hrv: {
        sdnn: isNaN(hrv.sdnn) ? 0 : hrv.sdnn, // Replace NaN with "ERRATIC"
        confidence: hrv.confidence || 0,
      },

      ppgData: ppgData, // Use the provided ppgData array
      timestamp: new Date(),
    };

    try {
      // Make a POST request to your backend endpoint that handles saving to MongoDB
      const response = await fetch('/api/save-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordData),
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ Data successfully saved to MongoDB:', result.data);
      } else {
        console.error('❌ Upload failed:', result.error);
      }
    } catch (error) {
      console.error('🚨 Network error - failed to save data:', error);
    } finally {
      setIsUploading(false); // Unlock the function
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-4xl mb-4">
        {/* Title */}
        <h1 className="text-3xl font-bold">HeartLen</h1>
        
        {/* User Panel */}
        <div className="flex items-center mb-4 md:mb-0">
          <input
            type="text"
            value={currentSubject}
            onChange={(e) => setCurrentSubject(e.target.value)}
            placeholder="Enter Subject ID"
            className="border border-gray-300 rounded-md p-2"
          />
          <button
            onClick={confirmUser}
            className="bg-cyan-500 text-white px-4 py-2 rounded-md ml-2"
          >
            Confirm User
          </button>
        </div>

        {/* Recording Button */}
        <button
          onClick={() => setIsRecording(!isRecording)}
          className={`p-3 rounded-lg text-sm transition-all duration-300 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-cyan-500 hover:bg-cyan-600 text-white'
          }`}
          disabled={!confirmedSubject} // Disable if no subject is confirmed
        >
          {isRecording ? '⏹ STOP' : '⏺ START'} RECORDING
        </button>
        {/* Sampling Button */}
        <button
          onClick={() => setIsSampling(!isSampling)}
          className={`p-3 rounded-lg text-sm transition-all duration-300 ml-2 ${
            isSampling
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-500 hover:bg-gray-600 text-white'
          }`}
          disabled={!isRecording || !confirmedSubject} // Enable only when recording is active and subject is confirmed
        >
          {isSampling ? '⏹ STOP SAMPLING' : '⏺ START SAMPLING'}
        </button>
      </div>

      {/* Subject Information Display */}
      {confirmedSubject && (
        <div className="w-full max-w-4xl mb-4 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold">Subject ID: {confirmedSubject}</h2>
          <p>Last Access: {historicalData.lastAccess || 'First visit'}</p>
          <p>Average Heart Rate: {historicalData.avgHeartRate?.toFixed(2) || 'No data'} BPM</p>
          <p>Average HRV: {historicalData.avgHRV?.toFixed(2) || 'No data'} ms</p>
        </div>
      )}

      {/* Main Grid: Camera and Chart Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        {/* Left Column: Camera Feed */}
        <div className="space-y-4">
          {/* Camera Feed */}
          <CameraFeed videoRef={videoRef} canvasRef={canvasRef} />
          {/* Signal Combination Selector */}
          <button
            onClick={() => setShowConfig((prev) => !prev)}
            className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 w-full"
          >
            Toggle Config
          </button>
          {showConfig && (
            <SignalCombinationSelector
              signalCombination={signalCombination}
              setSignalCombination={setSignalCombination}
            />
          )}
        </div>

        {/* Right Column: Chart and Metrics */}
        <div className="space-y-4">
          {/* Chart */}
          <ChartComponent ppgData={ppgData} valleys={valleys} />

          {/* Save Data to MongoDB Button */}
          <button
            onClick={pushDataToMongo}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Save Data to MongoDB
          </button>

          {/* Metrics Cards (Side by Side) */}
          <div className="flex flex-wrap gap-4">
            {/* Heart Rate Card */}
            <MetricsCard
              title="HEART RATE"
              value={heartRate || {}} // Pass the HeartRateResult object
              confidence={heartRate?.confidence || 0}
            />

            {/* HRV Card */}
            <MetricsCard
              title="HRV"
              value={hrv || {}} // Pass the HRVResult object
              confidence={hrv?.confidence || 0}
            />

            {/* Signal Quality Card (Fallback for now) */}
            <MetricsCard
              title="SIGNAL QUALITY"
              value={signalQuality || '--'} // String value for signal quality
              confidence={qualityConfidence || 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}