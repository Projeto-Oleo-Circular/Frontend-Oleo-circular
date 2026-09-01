import { ReactNode } from 'react'

interface ButtonProps {
    type?: 'button' | 'submit' | 'reset'
    onClick?: () => void
    children: ReactNode
    loading?: boolean
    disabled?: boolean
    variant?: 'primary' | 'secondary' | 'terciary' | 'outline' | 'danger' | 'success'
    size?: 'sm' | 'md' | 'lg'
    fullWidth?: boolean
    className?: string
}

function Button({
    type = 'button',
    onClick,
    children,
    loading = false,
    disabled = false,
    variant = 'primary',
    size = 'md',
    fullWidth = true,
    className = ''
}: ButtonProps) {
    const baseStyles = 'font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg'
    }

    const variants = {
        primary: 'bg-green-primary text-white-primary hover:bg-green-hover',
        secondary: 'bg-white-primary text-green-primary border-2 border-green-primary hover:bg-green-100',
        terciary: 'bg-orange-primary text-white-primary border-2 hover:bg-orange-hover',
        outline: 'bg-transparent text-green-primary border-2 border-green-primary hover:bg-green-50',
        danger: 'bg-red-primary text-white-primary hover:bg-red-hover',
        success: 'bg-green-400 text-white-primary hover:bg-green-500'
    }

    const widthClass = fullWidth ? 'w-full' : ''

    const getSpinnerColor = () => {
        if (['primary', 'danger', 'success'].includes(variant)) return 'white'
        if (variant === 'terciary') return 'orange'
        return 'green'
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${widthClass} ${className}`}
        >
            {loading ? (
                <Spinner
                    color={getSpinnerColor()}
                    size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'} 
                />
            ) : (
                children
            )}
        </button>
    )
}

function Spinner({ color = 'white', size = 'md' }: { color?: 'white' | 'green' | 'orange' | 'black'; size?: 'sm' | 'md' | 'lg' }) {
    const sizes = {
        sm: 'w-4 h-4 border-2',
        md: 'w-5 h-5 border-2',
        lg: 'w-6 h-6 border-3'
    }

    const colors = {
        white: 'border-white/30 border-t-white',
        green: 'border-green-primary/30 border-t-green-primary',
        orange: 'border-orange-primary/30 border-t-orange-primary',
        black: 'border-black-200 border-t-white-600'
    }

    return (
        <div className="inline-block">
            <div
                className={`${sizes[size]} ${colors[color]} rounded-full animate-spin`}
            />
        </div>
    )
}

export default Button

