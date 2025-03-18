interface MetricsCardProps {
  title: string;
  value: number | string | { bpm?: number; sdnn?: number };
  unit?: string;
  confidence?: number;
  color?: 'cyan' | 'purple' | 'green' | 'amber';
}

export default function MetricsCard({
  title,
  value,
  unit,
  confidence,
  color = 'cyan',
}: MetricsCardProps) {
  // Color mapping for different backgrounds and text
  const colorStyles = {
    cyan: {
      bg: 'bg-cyan-50 dark:bg-cyan-900/20',
      border: 'border-cyan-100 dark:border-cyan-800/30',
      title: 'text-cyan-700 dark:text-cyan-400',
      value: 'text-cyan-800 dark:text-cyan-300'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-100 dark:border-purple-800/30',
      title: 'text-purple-700 dark:text-purple-400',
      value: 'text-purple-800 dark:text-purple-300'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-100 dark:border-green-800/30',
      title: 'text-green-700 dark:text-green-400',
      value: 'text-green-800 dark:text-green-300'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-100 dark:border-amber-800/30',
      title: 'text-amber-700 dark:text-amber-400',
      value: 'text-amber-800 dark:text-amber-300'
    }
  };

  // Get the appropriate color styles
  
  // ...existing color mapping code...

  // Get the appropriate color styles
  const styles = colorStyles[color];

  return (
    <div className={`${styles.bg} h-full flex flex-col p-4 rounded-lg shadow-md border ${styles.border}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`${styles.title} text-sm sm:text-base font-semibold uppercase tracking-wide`}>
          {title}
        </h3>
      </div>
      
      <div className="flex-grow flex items-center justify-center">
        <h2 className={`${styles.value} text-2xl sm:text-3xl md:text-4xl font-bold text-center`}>
          {typeof value === 'number' && value > 0
            ? `${value}${unit ? ` ${unit}` : ''}`
            : typeof value === 'string'
            ? value
            : typeof value === 'object' && value !== null
            ? value.bpm !== undefined
              ? `${value.bpm} BPM`
              : value.sdnn !== undefined
              ? isNaN(value.sdnn)
                ? '--'
                : `${value.sdnn} ms`
              : '--'
            : '--'}
        </h2>
      </div>

      {confidence !== undefined && (
        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Confidence
            </span>
            <span className={`${styles.value} text-sm font-semibold`}>
              {confidence.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ease-out ${
                confidence >= 75 ? 'bg-green-500' :
                confidence >= 50 ? 'bg-amber-500' :
                confidence >= 25 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(confidence, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}