import { useState, ChangeEvent } from 'react'

function Input({
  type = 'text',
  placeholder = '',
  icon,
  as,
  error,
  value,
  onChange,
  noBorder = false,
  name,
  disabled,
  className = ''
}: {
  type?: string
  placeholder?: string
  icon?: string
  as?: string
  error?: string
  value?: string | number
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  noBorder?: boolean
  name?: string
  disabled?: boolean
  className?: string
}) {
  const [showPassword, setShowPassword] = useState(false)

  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  const borderClass = noBorder ? 'border-none' : 'border-2 border-white-100'

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(e)
  }

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) onChange(e)
  }

  if (as === 'textarea') {
    return (
      <div className="w-full">
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={handleTextareaChange}
          disabled={disabled}
          className={`w-full px-4 py-4 rounded-xl outline-none text-sm bg-white text-black-200 resize-none h-28 ${borderClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        />
        {error && <p className="text-red-primary text-xs mt-1">{error}</p>}
      </div>
    )
  }

  return (
    <div className={`flex flex-col px-4 py-4 gap-0 bg-white ${borderClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <img
            src={`src/assets/icons/${icon}.svg`}
            alt={icon}
            className="h-5 w-5 flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        )}
        <input
          type={inputType}
          placeholder={placeholder}
          value={value || ''}
          onChange={handleChange}
          name={name}
          disabled={disabled}
          className="flex-1 outline-none text-sm bg-transparent text-black-200 disabled:cursor-not-allowed placeholder:text-black-100"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            className="disabled:opacity-50 flex-shrink-0"
          >
            <img
              src={showPassword ? 'src/assets/icons/eye-active.svg' : 'src/assets/icons/eye-default.svg'}
              alt="Mostrar senha"
              className="h-5 w-5"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </button>
        )}
      </div>
      {error && (
        <p className="text-red-primary text-xs mt-1 font-medium pl-8">
          {error}
        </p>
      )}
    </div>
  )
}

export default Input