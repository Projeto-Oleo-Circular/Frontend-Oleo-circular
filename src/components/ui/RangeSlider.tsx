import { useState } from 'react'

interface RangeSliderProps {
    marks: { value: number; label: string }[]
    defaultValue?: number
    onChange?: (value: number) => void
}

function RangeSlider({ marks, defaultValue = 20,onChange }: RangeSliderProps) {
    const defaultIndex = Math.max(0, marks.findIndex(m => m.value === defaultValue))
    const [index, setIndex] = useState<number>(defaultIndex)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newIndex = Number(e.target.value);
        setIndex(newIndex)
        if (onChange) onChange(marks[newIndex].value)  
    }

    const percentage = (index / (marks.length - 1)) * 100

    return (
        <div className="w-full py-4">
            <input
                type="range"
                min={0}
                max={marks.length - 1}
                step={1}
                value={index}
                onChange={handleChange}
                style={{
                    background: `linear-gradient(to right, #00993E 0%, #00993E ${percentage}%, #D9D9D9 ${percentage}%, #D9D9D9 100%)`
                }}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-6
                    [&::-webkit-slider-thumb]:h-6
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-green-400
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-white
                    [&::-webkit-slider-thumb]:shadow-md
                    [&::-moz-range-thumb]:w-6
                    [&::-moz-range-thumb]:h-6
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-green-400
                    [&::-moz-range-thumb]:border-2
                    [&::-moz-range-thumb]:border-white"
                />

                <div className="flex justify-between mt-4">
                    {marks.map((mark, i) => (
                        <button 
                            key={mark.value}
                            onClick={() => {
                                setIndex(i)
                                if (onChange) onChange(mark.value)
                            }}
                            className={`px-3 py-1 rounded-2xl text-sm font-bold transition-all duration-200 ${
                                i === index
                                    ? 'bg-green-400 text-white-primary'
                                    : 'bg-transparent text-black-100'
                            }`}
                        >
                            {mark.label}
                        </button>
                    ))}
                </div>
            </div>
    );
}

export default RangeSlider;