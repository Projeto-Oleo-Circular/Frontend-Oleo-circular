import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

/**
 * Envolve as telas do fluxo (Home, Mapa, Coletas, Pontos, Perfil).
 * O <Outlet /> troca o conteúdo conforme a rota; a BottomNav
 * fica fixa embaixo, sem remontar a cada navegação.
 */
function HomeLayout() {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            <div className="flex-1 overflow-y-auto">
                <Outlet />
            </div>
            <BottomNav />
        </div>
    );
}

export default HomeLayout;
