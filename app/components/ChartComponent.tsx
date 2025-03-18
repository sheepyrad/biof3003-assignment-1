// components/ChartComponent.tsx
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChartComponentProps {
  ppgData: number[];
  valleys: { index: number; value: number }[];
}

export default function ChartComponent({
  ppgData,
  valleys,
}: ChartComponentProps) {
  // Define colors as constants for consistency
  const valleyColor = 'rgb(248, 113, 113)';
  const signalColor = 'rgb(56, 189, 248)';
  
  const chartData = {
    labels: Array.from({ length: ppgData.length }, (_, i) => i.toString()),
    datasets: [
      {
        label: 'PPG Signal',
        data: ppgData,
        borderColor: signalColor,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(23, 181, 249, 0.93)',
        pointRadius: 0,
      },
      {
        label: 'Valleys',
        data: ppgData.map(
          (_, i) => valleys.find((v) => v.index === i)?.value || null
        ),
        pointBackgroundColor: valleyColor,
        pointBorderColor: valleyColor,
        pointRadius: 4,
        pointHoverRadius: 6,
        showLine: false,
        pointStyle: 'circle',
        borderColor: valleyColor, // This is needed for the legend
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(160, 160, 160, 0.15)',
        },
        ticks: {
          color: '#d1d5db',
          font: {
            size: 11,
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#d1d5db',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
          font: {
            size: 11,
          }
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#d1d5db',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          padding: 15,
          usePointStyle: true,  // Use point style in legend
          pointStyle: 'circle', // Force circle point style in legend
        },
        position: 'top' as const,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f9fafb',
        bodyColor: '#f9fafb',
        padding: 10,
        cornerRadius: 6,
        displayColors: true,
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
      }
    },
    animation: {
      duration: 0,
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 h-full">
      <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">PPG Signal</h2>
      <div className="h-[300px] w-full">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}