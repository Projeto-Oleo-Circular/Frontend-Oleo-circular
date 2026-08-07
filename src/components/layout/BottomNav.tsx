import { NavLink } from "react-router-dom"
interface NavItem {
    to: string
    label: string
    iconSrc: string
}

const NAV_ITEMS: NavItem[] = [
    { to: "/home", label: "Início", iconSrc: "/assets/icons/home.svg" },
    { to: "/map", label: "Mapa", iconSrc: "/assets/icons/map.svg" },
    { to: "/my-requests", label: "Coletas", iconSrc: "/assets/icons/caminhao.svg"},
    { to: "/my-points", label: "Pontos", iconSrc: "/assets/icons/icon-pontos.svg" },
    { to: "/profile", label: "Perfil", iconSrc: "/assets/icons/profile.svg" },
]

function BottomNav() {
    return (
        <nav className="bg-white-primary border-t border-white-100 py-2 flex justify-around items-center">
            {NAV_ITEMS.map(({ to, label, iconSrc }) => (
                <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                        `flex flex-col items-center gap-0.5 text-md font-bold transition-colors duration-200 ${
                            isActive 
                                ? "text-green-primary" 
                                : "text-black-primary hover:text-green-primary"
                        }`
                    }
                >
                    <span
                        className="w-6 h-6 bg-current inline-block transition-colors duration-200"
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
    );
}

export default BottomNav;