import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { authService } from "../../services/authService"

interface HeaderAppProps {
    userName?: string;
    userAvatar?: string
}

function HeaderApp({ userName = "Usuário", userAvatar }: HeaderAppProps) {
    const navigate = useNavigate()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    const handleLogout = () => {
        setLoading(true)
        authService.logout()
        setTimeout(() => {
            setLoading(false)
            navigate("/login")
        }, 500)
    }

    const handleProfile = () => {
        setIsMenuOpen(false)
        navigate("/profile")
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const getInitials = (name: string) => {
        return name.charAt(0).toUpperCase()
    }

    return (
        <header className="flex items-center justify-between px-4 md:px-8 py-3 bg-white border-b border-white-100 shadow-xs h-20 z-50">
            <img 
                src="/assets/logo-horizontal.svg" 
                alt="Logotipo do Óleo Circular" 
                className="h-8 sm:h-10 md:h-12 w-auto cursor-pointer" 
                onClick={() => navigate("/home")}
            />

            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="focus:outline-none focus:ring-2 focus:ring-green-primary rounded-full transition-all duration-200 hover:ring-2 hover:ring-green-primary"
                    aria-label="Menu do usuário"
                >
                    {userAvatar ? (
                        <img 
                            src={userAvatar} 
                            alt={userName} 
                            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-green-primary"
                        />
                    ) : (
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-green-primary text-white flex items-center justify-center text-sm sm:text-base font-bold border-2 border-green-primary">
                            {getInitials(userName)}
                        </div>
                    )}
                </button>

                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-xl shadow-lg border border-white-100 py-1 z-[100] animate-slide-down">
                        <button
                            onClick={handleProfile}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white-700 hover:bg-green-50 hover:text-green-primary transition-colors duration-150"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Perfil
                        </button>
                        
                        <button
                            onClick={handleLogout}
                            disabled={loading}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            {loading ? 'Saindo...' : 'Sair'}
                        </button>
                    </div>
                )}
            </div>
        </header>
    )
}

export default HeaderApp