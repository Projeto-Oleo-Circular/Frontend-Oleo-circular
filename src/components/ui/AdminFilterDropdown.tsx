import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react"; // Ou o ícone que estiver utilizando

export interface FilterOption {
    value: string;
    label: string;
}

interface AdminFilterDropdownProps {
    placeholder?: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
}

export default function AdminFilterDropdown({
    placeholder = "Filtros",
    options,
    value,
    onChange,
}: AdminFilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((opt) => opt.value === value);
    const labelExibido = selectedOption && selectedOption.value !== "" ? selectedOption.label : placeholder;

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex items-center justify-between gap-2 px-4 py-2 bg-transparent text-green-primary border border-green-primary rounded-lg font-semibold text-sm hover:bg-green-100 transition-colors focus:outline-none cursor-pointer"
            >
                <span>{labelExibido}</span>
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-48 bg-white border border-green-primary rounded-xl shadow-lg z-50 overflow-hidden py-1">
                    {options.map((option) => {
                        const isSelected = option.value === value;
                        return (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                                    isSelected
                                        ? "bg-green-400 text-white-primary"
                                        : "text-black-200 hover:bg-green-100 hover:text-green-primary"
                                }`}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}