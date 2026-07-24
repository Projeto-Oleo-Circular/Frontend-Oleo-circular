// components/ui/Input.tsx
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
    name,
    disabled
} : {
    type?: string;
    placeholder?: string;
    icon?: string;
    as?: string;
    error?: string;
    value?: string | number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    noBorder?: boolean;
    name?: string;
    disabled?: boolean;
}) {
    const [showPassword, setShowPassword] = useState(false);
    
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
    
    const borderClass = error ? 'border-2 border-red-primary' : noBorder ? 'border-none' : 'border-2 border-white-100';

    // Verificar se o ícone existe
    const getIconPath = (iconName: string) => {
        try {
            return `src/assets/icons/${iconName}.svg`;
        } catch {
            return null;
        }
    };

    if (as === 'textarea') {
        return (
            <div className="w-full">
                <textarea
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={`w-full px-4 py-3 rounded-xl outline-none text-sm bg-white text-black-200 resize-none h-24 ${borderClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {error && <p className="text-red-primary text-xs mt-1">{error}</p>}
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className={`flex items-center px-4 py-3 gap-3 bg-white rounded-xl ${borderClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {icon && (
                    <img 
                        src={`src/assets/icons/${icon}.svg`} 
                        alt={icon}
                        className="h-5 w-5"
                        onError={(e) => {
                            // Esconde o ícone se não carregar
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                )}
                <input
                    type={inputType}
                    placeholder={placeholder}
                    value={value || ''}
                    onChange={onChange}
                    name={name}
                    disabled={disabled}
                    className="flex-1 outline-none text-sm bg-transparent text-black-200 disabled:cursor-not-allowed"
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={disabled}
                        className="disabled:opacity-50"
                    >
                        <img
                            src={showPassword ? 'src/assets/icons/eye-active.svg' : 'src/assets/icons/eye-default.svg'}
                            alt="Mostrar senha"
                            className="h-5 w-5"
                            onError={(e) => {
                                // Fallback para texto se o ícone não existir
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </button>
                )}
            </div>
            {error && <p className="text-red-primary text-xs mt-1">{error}</p>}
        </div>
    );
}

export default Input;