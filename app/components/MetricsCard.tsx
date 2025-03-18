interface MetricsCardProps {
  title: string;
  value: number | string | { bpm?: number; sdnn?: number }; // Add string to allowed types
  unit?: string;
  confidence?: number;
}

export default function MetricsCard({
  title,
  value,
  unit,
  confidence,
}: MetricsCardProps) {
  return (
    <div className="bg-white p-3 md:p-4 rounded-lg shadow flex-1 min-w-[120px] sm:min-w-[150px] md:min-w-[180px] transition-all">
      <p className="text-gray-500 text-sm sm:text-base">{title}</p>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 md:mt-2 break-words">
        {typeof value === 'number' && value > 0
          ? `${value} ${unit || ''}` 
          : typeof value === 'string'
          ? value // Handle string values directly
          : typeof value === 'object' && value !== null
          ? value.bpm !== undefined
            ? `${value.bpm} BPM`
            : value.sdnn !== undefined
            ? isNaN(value.sdnn)
              ? '--'
              : `${value.sdnn} ms`
            : '--'
          : '--'}{' '}
      </h2>
      {confidence !== undefined && (
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Confidence: {confidence.toFixed(1)}%
        </p>
      )}
    </div>
  );
}