import { useState } from 'react'

interface Option {
    value: string
    label: string
}

interface Props {
    placeholder?: string
    options: Option[]
    value: string | null
    onChange: (value: string) => void
}

function Dropdown({ placeholder = 'Selecione um parceiro', options, value, onChange }: Props) {
    const [open, setOpen] = useState(false)

    const selected = options.find(o => o.value === value)

    return (
        <div className="relative w-full">
            <button
                onClick={() => setOpen(prev => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-white-200 text-sm hover:border-green-primary transition-colors duration-200"
            >
                <span className={selected ? 'text-white-500' : 'text-black-100'}>
                    {selected ? selected.label : placeholder}
                </span>
                <span className={`text-green-primary transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </button>

            {open && (
                <div className="absolute z-10 w-full bg-white rounded-xl border border-white-200 shadow-lg mt-1 overflow-hidden">
                    {options.map(option => (
                        <button
                            key={option.value}
                            onClick={() => {
                                onChange(option.value)
                                setOpen(false)
                            }}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors duration-150 ${
                                value === option.value
                                    ? 'bg-green-400 text-white font-bold'
                                    : 'text-black-200 hover:bg-green-100'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Dropdown