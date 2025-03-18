// components/SignalCombinationSelector.tsx
interface SignalCombinationSelectorProps {
    signalCombination: string;
    setSignalCombination: (value: string) => void;
  }
  
  export default function SignalCombinationSelector({
    signalCombination,
    setSignalCombination,
  }: SignalCombinationSelectorProps) {
    const options = [
      { value: 'default', label: 'Default (2R - G - B)' },
      { value: 'redOnly', label: 'Red Only' },
      { value: 'greenOnly', label: 'Green Only' },
      { value: 'blueOnly', label: 'Blue Only' },
      { value: 'redMinusBlue', label: 'Red - Blue' },
      { value: 'custom', label: 'Custom (3R - G - B)' },
    ];
  
    return (
      <div className="mt-4">
        <label
          htmlFor="signal-combination"
          className="block text-sm font-medium text-gray-700"
        >
          Signal Combination
        </label>
        <select
          id="signal-combination"
          value={signalCombination}
          onChange={(e) => setSignalCombination(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }