interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    id?: string;
    className?: string;
}

function Checkbox({ checked, onChange, id, className = '' }: CheckboxProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.checked);
    };

    return (
        <div className={`relative flex items-center ${className}`}>
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={handleChange}
                className="peer hidden"
            />
            <label
                htmlFor={id}
                className="w-5 h-5 rounded-md border-2 border-white-300 flex items-center justify-center cursor-pointer 
                    peer-checked:bg-green-primary peer-checked:border-green-primary 
                    peer-checked:after:content-['✓'] peer-checked:after:text-white 
                    peer-checked:after:text-sm peer-checked:after:font-bold 
                    transition-all duration-200 hover:border-green-primary"
            />
        </div>
    );
}

export default Checkbox;