import { useState } from 'react';

function Input ({
    type = 'text',
    placeholder = '',
    icon,
    as,
    error,
    value,
    onChange,
    noBorder = false,
} : {
    type?: string;
    placeholder?: string;
    icon?: string;
    as?: string;
    error?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    noBorder?: boolean;
}) {
    const [showPassword, setShowPassword] = useState(false);
    
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
    
    const borderClass = error ? 'border-2 border-red-primary' : noBorder ? 'border-none' : 'border-2 border-white-100';

    if (as === 'textarea') {
        return (
            <div className="w-full">
                <textarea
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className={`w-full px-4 py-3 rounded-xl outline-none text-sm bg-white text-black-200 resize-none h-24 ${borderClass}`}
                />
                {error && <p className="text-red-primary text-xs mt-1">{error}</p>}
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className={`flex items-center px-4 py-3 gap-3  bg-white rounded-xl ${borderClass}`}>
                {icon && (
                    <img src={`src/assets/icons/${icon}.svg`} alt="" className="h-5 w-5" />
                )}
                <input
                    type={inputType}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className="flex-1 outline-none text-sm bg-transparent text-black-200"
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        <img
                            src={showPassword ? 'src/assets/icons/eye-active.svg' : 'src/assets/icons/eye-default.svg'}
                            alt="Mostrar senha"
                            className="h-5 w-5"
                        />
                    </button>
                )}
            </div>
            {error && <p className="text-red-primary text-xs mt-1">{error}</p>}
        </div>
    )
}

export default Input;