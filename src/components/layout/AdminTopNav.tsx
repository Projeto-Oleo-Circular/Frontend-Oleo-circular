import { useState, useRef, useEffect } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { useAdminAuth } from "../../hooks/useAdminAuth"

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", iconSrc: "/assets/icons/icon-dashboard.svg" },
  { to: "/admin/requests", label: "Solicitações", iconSrc: "/assets/icons/icon-solicitacao.svg" },
  { to: "/admin/map", label: "Mapa", iconSrc: "/assets/icons/map.svg" },
  { to: "/admin/list", label: "Lista", iconSrc: "/assets/icons/icon-list.svg" },
  { to: "/admin/my-points", label: "Meus Pontos", iconSrc: "/assets/icons/icon-pontos.svg" },
    { to: "/admin/partners-approval", label: "Meus Parceiros", iconSrc: "/assets/icons/icon-pontos.svg" },

];

function AdminTopNav() {
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const inicial = admin?.nome?.charAt(0).toUpperCase() ?? "A"

  const handleLogout = async () => {
    setLoading(true)
    if (logout) {
      await logout()
    } else {
      localStorage.removeItem("admin_token")
      localStorage.removeItem("admin_user")
    }
    setTimeout(() => {
      setLoading(false)
      navigate("/admin/login")
    }, 300);
  };

  const handleProfile = () => {
    setIsMenuOpen(false)
    setIsMobileNavOpen(false)
    navigate("/admin/profile-admin")
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="relative bg-white-primary border-b border-white-200 z-40">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-3.5 sm:py-5 w-full">
        
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="md:hidden p-2 rounded-lg text-black-200 hover:bg-green-100 hover:text-green-primary focus:outline-none transition-colors"
          aria-label="Abrir menu lateral"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center justify-center md:justify-start">
          <img
            src="/assets/logo-horizontal.svg"
            alt="Logo do Óleo Circular"
            className="h-8 sm:h-10 md:h-11 w-auto cursor-pointer"
            onClick={() => navigate("/admin/dashboard")}
          />
        </div>

        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {NAV_ITEMS.map(({ to, label, iconSrc }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3.5 lg:px-4 py-2.5 rounded-xl text-sm lg:text-base font-semibold transition-all ${
                  isActive
                    ? "bg-green-100 text-green-primary"
                    : "text-white-600 hover:text-green-primary hover:bg-green-100"
                }`
              }
            >
              <span
                className="w-4 h-4 bg-current inline-block transition-colors"
                style={{
                  maskImage: `url(${iconSrc})`,
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  maskSize: "contain",
                  WebkitMaskImage: `url(${iconSrc})`,
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  WebkitMaskSize: "contain",
                }}
              />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                handleProfile();
              } else {
                setIsMenuOpen(!isMenuOpen);
              }
            }}
            className="focus:outline-none focus:ring-2 focus:ring-green-primary rounded-full transition-all duration-200 hover:ring-2 hover:ring-green-primary cursor-pointer"
            aria-label="Menu do usuário"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-green-primary text-white-primary flex items-center justify-center text-sm sm:text-base font-bold border-2 border-green-primary shadow-sm">
              {inicial}
            </div>
          </button>

          {isMenuOpen && (
            <div className="hidden md:block absolute right-0 mt-2 w-48 bg-white-primary rounded-xl shadow-lg border border-white-100 py-1 z-[100] animate-slide-down">
              <button
                onClick={handleProfile}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-black-200 hover:bg-green-100 hover:text-green-primary transition-colors duration-150 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Perfil
              </button>

              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-100 transition-colors duration-150 disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {loading ? "Saindo..." : "Sair"}
              </button>
            </div>
          )}
        </div>
      </div>

      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileNavOpen(false)}
          />

          <div className="relative w-4/5 max-w-xs bg-white-primary h-full shadow-2xl flex flex-col justify-between p-5 z-10 animate-slide-right">
            
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white-100 mb-6">
                <img
                  src="/assets/logo-horizontal.svg"
                  alt="Logo do Óleo Circular"
                  className="h-8 w-auto"
                />
                <button
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1.5 rounded-lg text-white-600 hover:bg-white-100 hover:text-black-primary transition-colors"
                  aria-label="Fechar menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="flex flex-col gap-2">
                {NAV_ITEMS.map(({ to, label, iconSrc }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setIsMobileNavOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all ${
                        isActive
                          ? "bg-green-100 text-green-primary"
                          : "text-white-600 hover:text-green-primary hover:bg-green-100"
                      }`
                    }
                  >
                    <span
                      className="w-5 h-5 bg-current inline-block transition-colors"
                      style={{
                        maskImage: `url(${iconSrc})`,
                        maskRepeat: "no-repeat",
                        maskPosition: "center",
                        maskSize: "contain",
                        WebkitMaskImage: `url(${iconSrc})`,
                        WebkitMaskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                        WebkitMaskSize: "contain",
                      }}
                    />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-white-100">
              <div className="flex items-center justify-between">
                <div 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={handleProfile}
                >
                  <div className="w-10 h-10 rounded-full bg-green-primary text-white-primary flex items-center justify-center font-bold">
                    {inicial}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-black-primary text-sm line-clamp-1">
                      {admin?.nome ?? "Administrador"}
                    </span>
                    <span className="text-xs text-white-500">Ver Perfil</span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                  title="Sair da conta"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </header>
  );
}

export default AdminTopNav;