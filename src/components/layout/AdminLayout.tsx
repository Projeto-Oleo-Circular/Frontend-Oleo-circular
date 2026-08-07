import { Outlet } from "react-router-dom";
import AdminTopNav from "./AdminTopNav";

function AdminLayout() {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-white-100">
            <AdminTopNav />
            <div className="flex-1 overflow-y-auto">
                <Outlet />
            </div>
        </div>
    );
}

export default AdminLayout;
