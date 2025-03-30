// hooks/useSignalQuality.ts
import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';

interface SignalQualityResults {
  signalQuality: string;
  qualityConfidence: number;
}
export default function useSignalQuality(
  ppgData: number[]
): SignalQualityResults {
  const modelRef = useRef<tf.LayersModel | null>(null);
  const [signalQuality, setSignalQuality] = useState<string>('--');
  const [qualityConfidence, setQualityConfidence] = useState<number>(0);

  // Load TensorFlow.js model
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await tf.loadLayersModel('/tfjs_model/model.json');
        modelRef.current = loadedModel;
        console.log('PPG quality assessment model loaded successfully');
      } catch (error) {
        console.error('Error loading model:', error);
      }
    };

    loadModel();
  }, []);

  useEffect(() => {
    if (ppgData.length >= 100) {
      assessSignalQuality(ppgData);
    }
  }, [ppgData]);

  const assessSignalQuality = async (signal: number[]) => {
    if (!modelRef.current || signal.length < 100) return;

    try {
      const features = calculateFeatures(signal);
      const inputTensor = tf.tensor2d([features]);
      const prediction = (await modelRef.current.predict(
        inputTensor
      )) as tf.Tensor;
      const probabilities = await prediction.data();

      const classIndex = probabilities.indexOf(Math.max(...probabilities));
      const classes = ['bad', 'acceptable', 'excellent'];
      const predictedClass = classes[classIndex];
      const confidence = probabilities[classIndex] * 100;

      setSignalQuality(predictedClass);
      setQualityConfidence(confidence);

      inputTensor.dispose();
      prediction.dispose();
    } catch (error) {
      console.error('Error assessing signal quality:', error);
    }
  };

  const calculateFeatures = (signal: number[]): number[] => {
    if (!signal.length) return new Array(15).fill(0);

    // Basic statistical features
    const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
    const median = [...signal].sort((a, b) => a - b)[Math.floor(signal.length / 2)];
    const variance = signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signal.length;
    const std = Math.sqrt(variance);

    // Calculate skewness
    const cubedDiffs = signal.map((val) => Math.pow(val - mean, 3));
    const skewness =
      cubedDiffs.reduce((sum, val) => sum + val, 0) /
      signal.length /
      Math.pow(std, 3);

    // Calculate kurtosis
    const fourthPowerDiffs = signal.map((val) => Math.pow(val - mean, 4));
    const kurtosis =
      fourthPowerDiffs.reduce((sum, val) => sum + val, 0) /
      signal.length /
      Math.pow(std, 4);

    // Calculate signal range and peak-to-peak
    const max = Math.max(...signal);
    const min = Math.min(...signal);
    const signalRange = max - min;
    const peakToPeak = signalRange;

    // Calculate zero crossings
    let zeroCrossings = 0;
    for (let i = 1; i < signal.length; i++) {
      if (
        (signal[i] >= 0 && signal[i - 1] < 0) ||
        (signal[i] < 0 && signal[i - 1] >= 0)
      ) {
        zeroCrossings++;
      }
    }

    // Calculate RMS
    const squaredSum = signal.reduce((sum, val) => sum + val * val, 0);
    const rms = Math.sqrt(squaredSum / signal.length);

    // Frequency domain features using FFT
    const fftResult = computeFFT(signal);
    const dominantFreq = findDominantFrequency(fftResult, 100); // Assuming 100Hz sampling rate
    
    // PPG-specific features
    const signalToNoiseRatio = calculateSNR(signal);
    const perfusionIndex = calculatePerfusionIndex(signal);
    const signalContinuity = calculateContinuity(signal);
    
    return [
      mean,
      std,
      median,
      variance,
      skewness,
      kurtosis,
      signalRange,
      zeroCrossings,
      rms,
      peakToPeak,
      dominantFreq,
      signalToNoiseRatio,
      perfusionIndex,
      signalContinuity,
      calculateEntropyEstimate(signal),
    ];
  };

  // Helper functions for feature extraction

  // Simple FFT computation for frequency domain features
  const computeFFT = (signal: number[]): number[] => {
    const fft = tf.spectral.rfft(tf.tensor1d(signal));
    const fftMagnitude = tf.abs(fft);
    const result = Array.from(fftMagnitude.dataSync());
    fftMagnitude.dispose();
    fft.dispose();
    return result;
  };

  // Find dominant frequency component
  const findDominantFrequency = (fftResult: number[], samplingRate: number): number => {
    if (fftResult.length === 0) return 0;
    const maxIndex = fftResult.indexOf(Math.max(...fftResult));
    return (maxIndex * samplingRate) / (2 * fftResult.length);
  };

  // Estimate signal-to-noise ratio
  const calculateSNR = (signal: number[]): number => {
    if (signal.length < 4) return 0;
    
    // Estimate signal by applying a simple moving average filter
    const windowSize = 5;
    const smoothedSignal: number[] = [];
    
    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - windowSize); j < Math.min(signal.length, i + windowSize + 1); j++) {
        sum += signal[j];
        count++;
      }
      smoothedSignal.push(sum / count);
    }
    
    // Calculate signal power
    const signalPower = smoothedSignal.reduce((acc, val) => acc + val * val, 0) / smoothedSignal.length;
    
    // Calculate noise as difference between original and smoothed signal
    const noise = signal.map((val, i) => val - smoothedSignal[i]);
    const noisePower = noise.reduce((acc, val) => acc + val * val, 0) / noise.length;
    
    return noisePower > 0 ? 10 * Math.log10(signalPower / noisePower) : 0;
  };

  // Calculate perfusion index - ratio between pulsatile and non-pulsatile blood flow
  const calculatePerfusionIndex = (signal: number[]): number => {
    if (signal.length === 0) return 0;
    const min = Math.min(...signal);
    const max = Math.max(...signal);
    const ac = max - min; // AC component
    const dc = signal.reduce((sum, val) => sum + val, 0) / signal.length; // DC component
    return dc !== 0 ? (ac / dc) * 100 : 0;
  };

  // Calculate signal continuity - measure of sudden changes in signal
  const calculateContinuity = (signal: number[]): number => {
    if (signal.length < 2) return 0;
    let discontinuities = 0;
    const threshold = 3 * calculateStandardDeviation(signal);
    
    for (let i = 1; i < signal.length; i++) {
      if (Math.abs(signal[i] - signal[i - 1]) > threshold) {
        discontinuities++;
      }
    }
    
    return 1 - (discontinuities / (signal.length - 1));
  };

  // Helper function for standard deviation calculation
  const calculateStandardDeviation = (signal: number[]): number => {
    const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
    const variance = signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signal.length;
    return Math.sqrt(variance);
  };

  // Estimate entropy as a measure of signal complexity/randomness
  const calculateEntropyEstimate = (signal: number[]): number => {
    if (signal.length === 0) return 0;
    
    // Normalize signal to range [0, 9] and bin values
    const min = Math.min(...signal);
    const max = Math.max(...signal);
    const range = max - min;
    
    if (range === 0) return 0;
    
    const bins = 10;
    const binCounts = new Array(bins).fill(0);
    
    // Count occurrences in each bin
    signal.forEach(value => {
      const binIndex = Math.min(bins - 1, Math.floor((value - min) / range * bins));
      binCounts[binIndex]++;
    });
    
    // Calculate entropy
    let entropy = 0;
    const total = signal.length;
    
    binCounts.forEach(count => {
      if (count > 0) {
        const probability = count / total;
        entropy -= probability * Math.log2(probability);
      }
    });
    
    return entropy;
  };

  return { signalQuality, qualityConfidence };
}