import { NavLink } from "react-router-dom"
import { Home, Map, Truck, MapPin, User, LucideIcon } from "lucide-react"

interface NavItem {
    to: string
    label: string
    Icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
    { to: "/home", label: "Início", Icon: Home },
    { to: "/map", label: "Mapa", Icon: Map },
    { to: "/my-requests", label: "Coletas", Icon: Truck },
    { to: "/my-points", label: "Pontos", Icon: MapPin },
    { to: "/profile", label: "Perfil", Icon: User },
]

function BottomNav() {
    return (
        <nav className="bg-white-primary border-t border-white-100 py-2 flex justify-around items-center">
            {NAV_ITEMS.map(({ to, label, Icon }) => (
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
                    {({ isActive }) => (
                        <>
                            <Icon
                                size={24}
                                className="transition-colors duration-200"
                                strokeWidth={isActive ? 2.5 : 2}
                                color="currentColor"
                            />
                            <span>{label}</span>
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    );
}

export default BottomNav;