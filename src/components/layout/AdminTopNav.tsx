import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../hooks/useAdminAuth";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", iconSrc: "/assets/icons/icon-dashboard.svg" },
  { to: "/admin/requests", label: "Solicitações", iconSrc: "/assets/icons/icon-solicitacao.svg" },
  { to: "/admin/map", label: "Mapa", iconSrc: "/assets/icons/map.svg" },
  { to: "/admin/list", label: "Lista", iconSrc: "/assets/icons/icon-list.svg" },
  { to: "/admin/my-points", label: "Meus Pontos", iconSrc: "/assets/icons/icon-pontos.svg" },
];

function AdminTopNav() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const inicial = admin?.nome?.charAt(0).toUpperCase() ?? "A";

  const handleLogout = async () => {
    setLoading(true);
    if (logout) {
      await logout();
    } else {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
    }
    setTimeout(() => {
      setLoading(false);
      navigate("/admin/login");
    }, 300);
  };

  const handleProfile = () => {
    setIsMenuOpen(false);
    setIsMobileNavOpen(false);
    navigate("/admin/profile-admin");
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
      {/* Topbar com bom espaçamento vertical e alinhamento totalmente à esquerda/direita */}
      <div className="flex items-center justify-between px-6 lg:px-12 py-4 sm:py-5 w-full">
        {/* Logo alinhada à esquerda */}
        <div className="flex items-center">
          <img
            src="/assets/logo-horizontal.svg"
            alt="Logo do Óleo Circular"
            className="h-9 sm:h-11 w-auto cursor-pointer"
            onClick={() => navigate("/admin/dashboard")}
          />
        </div>

        {/* Navegação Desktop */}
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

        {/* Perfil Desktop */}
        <div className="hidden md:block relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="focus:outline-none focus:ring-2 focus:ring-green-primary rounded-full transition-all duration-200 hover:ring-2 hover:ring-green-primary cursor-pointer"
            aria-label="Menu do usuário"
          >
            <div className="w-10 h-10 rounded-full bg-green-primary text-white-primary flex items-center justify-center text-base font-bold border-2 border-green-primary shadow-sm">
              {inicial}
            </div>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white-primary rounded-xl shadow-lg border border-white-100 py-1 z-[100] animate-slide-down">
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

        {/* Botão Hambúrguer Mobile (Canto Direito) */}
        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="md:hidden p-2 rounded-lg text-black-200 hover:bg-green-100 hover:text-green-primary focus:outline-none transition-colors"
          aria-label="Menu principal"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileNavOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Gaveta Mobile Expandida */}
      {isMobileNavOpen && (
        <div className="md:hidden border-t border-white-200 bg-white-primary px-6 py-4 flex flex-col gap-4 animate-slide-down">
          {/* Cabeçalho do Perfil dentro do Menu Mobile */}
          <div className="flex items-center justify-between pb-3 border-b border-white-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-primary text-white-primary flex items-center justify-center text-base font-bold">
                {inicial}
              </div>
              <span className="font-semibold text-black-200 text-sm">
                {admin?.nome ?? "Administrador"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleProfile}
                className="p-2 text-white-600 hover:text-green-primary rounded-lg hover:bg-green-100 transition-colors"
                title="Perfil"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="p-2 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                title="Sair"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Links de Navegação Mobile */}
          <nav className="flex flex-col gap-1.5">
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
      )}
    </header>
  );
}

export default AdminTopNav;