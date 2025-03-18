// hooks/useMongoDB.ts
import { useState } from 'react';

interface HistoricalData {
  avgHeartRate: number;
  avgHRV: number;
  lastAccess?: string;
}

interface RecordData {
  subjectId: string;
  heartRate: {
    bpm: number;
    confidence: number;
  };
  hrv: {
    sdnn: number;
    confidence: number;
  };
  ppgData: number[];
  timestamp: Date;
}

export default function useMongoDB(subjectId: string = '') {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const [historicalData, setHistoricalData] = useState<HistoricalData>({
    avgHeartRate: 0,
    avgHRV: 0,
    lastAccess: undefined,
  });

  // POST: Save data to MongoDB
  const pushDataToMongo = async (recordData: RecordData) => {
    if (isUploading || !subjectId) return; // Prevent overlapping calls or calls without subject ID
    setIsUploading(true);
    try {
      // Ensure subjectId is included in the data
      const dataWithSubject = {
        ...recordData,
        subjectId: recordData.subjectId || subjectId,
      };
      
      const response = await fetch('/api/save-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataWithSubject),
      });
      const result = await response.json();
      if (result.success) {
        console.log('✅ Data saved:', result.data);
      } else {
        console.error('❌ Error:', result.error);
      }
    } catch (error) {
      console.error('🚨 Network error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // GET: Fetch historical averages for specific subject
  const fetchHistoricalData = async () => {
    if (!subjectId) return; // Skip if no subject ID
    
    setIsLoading(true); // Set loading to true when fetching starts
    try {
      const response = await fetch(`/api/save-record?subjectId=${subjectId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (result.success) {
        setHistoricalData({
          avgHeartRate: result.data.avgHeartRate,
          avgHRV: result.data.avgHRV,
          lastAccess: result.data.lastAccess,
        });
      } else {
        console.error('❌ Error:', result.error);
      }
    } catch (error) {
      console.error('🚨 Network error:', error);
    } finally {
      setIsLoading(false); // Set loading to false when fetching ends
    }
  };

  return {
    isUploading,
    isLoading, // Return loading state
    pushDataToMongo,
    fetchHistoricalData,
    historicalData,
  };
}
