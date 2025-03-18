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
  const [isSampling, setIsSampling] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [signalCombination, setSignalCombination] = useState('default');
  const [showConfig, setShowConfig] = useState(false);
  const [currentSubject, setCurrentSubject] = useState('');
  const [confirmedSubject, setConfirmedSubject] = useState('');
  // New state for sidebar collapse in mobile view
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      // Close sidebar on mobile after confirming user
      setSidebarOpen(false);
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

  // Process frame logic
  useEffect(() => {
    let animationFrame: number;
    const processFrameLoop = () => {
      if (isRecording) {
        processFrame();
        animationFrame = requestAnimationFrame(processFrameLoop);
      }
    };
    if (isRecording) {
      processFrameLoop();
    }
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isRecording]);

  // Automatic data sending
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isSampling && ppgData.length > 0) {
      intervalId = setInterval(() => {
        pushDataToMongo();
      }, 10000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isSampling, ppgData]);

  // Push data to MongoDB function
  const pushDataToMongo = async () => {
    if (isUploading) return;
    setIsUploading(true);

    if (ppgData.length === 0) {
      console.warn('No PPG data to send to MongoDB');
      setIsUploading(false);
      return;
    }

    const recordData = {
      subjectId: confirmedSubject,
      heartRate: {
        bpm: isNaN(heartRate.bpm) ? 0 : heartRate.bpm,
        confidence: hrv.confidence || 0,
      },
      hrv: {
        sdnn: isNaN(hrv.sdnn) ? 0 : hrv.sdnn,
        confidence: hrv.confidence || 0,
      },
      ppgData: ppgData,
      timestamp: new Date(),
    };

    try {
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
      setIsUploading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar - User Controls */}
      <div
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
                   fixed md:static w-64 h-full bg-white dark:bg-gray-800 shadow-lg 
                   transition-transform duration-300 ease-in-out z-30`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">HeartLen</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">PPG Analysis Tool</p>
        </div>

        {/* User Panel */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">User Panel</h2>
          <div className="space-y-3">
            <input
              type="text"
              value={currentSubject}
              onChange={(e) => setCurrentSubject(e.target.value)}
              placeholder="Enter Subject ID"
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                        text-gray-700 dark:text-gray-200 rounded-md p-2 focus:outline-none 
                        focus:ring-2 focus:ring-cyan-500"
            />
            <button
              onClick={confirmUser}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-2 
                        rounded-md transition-colors duration-200"
            >
              Confirm User
            </button>
          </div>
        </div>

        {/* Subject Information */}
        {confirmedSubject && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Subject Information</h2>
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
              <h3 className="font-medium text-blue-700 dark:text-blue-300">ID: {confirmedSubject}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last Access: {historicalData.lastAccess
                  ? new Date(historicalData.lastAccess).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })
                  : 'First visit'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg HR: {historicalData.avgHeartRate?.toFixed(2) || 'No data'} BPM</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg HRV: {historicalData.avgHRV?.toFixed(2) || 'No data'} ms</p>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Controls</h2>
          <div className="space-y-3">
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 
                        ${isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-cyan-500 hover:bg-cyan-600 text-white'}`}
              disabled={!confirmedSubject}
            >
              {isRecording ? '⏹ STOP' : '⏺ START'} RECORDING
            </button>

            <button
              onClick={() => setIsSampling(!isSampling)}
              className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300
                        ${isSampling
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-500 hover:bg-gray-600 text-white'}`}
              disabled={!isRecording || !confirmedSubject}
            >
              {isSampling ? '⏹ STOP SAMPLING' : '⏺ START SAMPLING'}
            </button>

            <button
              onClick={pushDataToMongo}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 
                       rounded-md transition-colors duration-200 disabled:opacity-50"
              disabled={isUploading || ppgData.length === 0 || !confirmedSubject}
            >
              {isUploading ? 'Saving...' : 'Save Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed bottom-4 left-4 z-40 bg-cyan-500 text-white p-3 rounded-full shadow-lg"
      >
        {sidebarOpen ? '✖' : '☰'}
      </button>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {/* Dashboard Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Camera Feed - Spans 2 columns on large screens */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">Camera Feed</h2>
              </div>
              <div className="p-4">
                <CameraFeed videoRef={videoRef} canvasRef={canvasRef} />
              </div>
            </div>

            {/* Signal Configuration */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">Signal Configuration</h2>
              </div>
              <div className="p-4">
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="w-full px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"
                >
                  {showConfig ? 'Hide Config' : 'Show Config'}
                </button>

                {showConfig && (
                  <div className="mt-4">
                    <SignalCombinationSelector
                      signalCombination={signalCombination}
                      setSignalCombination={setSignalCombination}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Chart Component - Full width */}
            <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">PPG Signal Chart</h2>
              </div>
              <div className="flex-grow" style={{ height: "400px" }}>
                <ChartComponent ppgData={ppgData} valleys={valleys} />
              </div>
            </div>

            {/* Metrics Cards - Full width container matching other sections */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden h-[200px]">
                <MetricsCard
                  title="Heart Rate"
                  value={heartRate || {}}
                  confidence={heartRate?.confidence || 0}
                  color="purple"
                />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden h-[200px]">
                <MetricsCard
                  title="HRV"
                  value={hrv || {}}
                  confidence={hrv?.confidence || 0}
                  color="green"
                />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden h-[200px]">
                <MetricsCard
                  title="Signal Quality"
                  value={signalQuality || '--'}
                  confidence={qualityConfidence || 0}
                  color="amber"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}