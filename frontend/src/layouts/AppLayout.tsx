import { useRef, useState } from "react";
import { Outlet } from "react-router";
import { Menu } from "lucide-react";
import Sidebar from "../components/navigation/Sidebar";
import RentoraLight from "../assets/rentora-wordmark-light.svg";

function AppLayout() {
    // Phones only: whether the sidebar drawer is open. From md up the sidebar is always shown.
    const [menuOpen, setMenuOpen] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    function closeMenu() {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
    }

    return (
        <div className="min-h-screen md:flex">
            <header className="sticky top-0 z-30 flex items-center gap-3 bg-[#14302b] px-4 py-3 md:hidden">
                <button
                    ref={menuButtonRef}
                    type="button"
                    onClick={() => setMenuOpen(true)}
                    aria-label="Open menu"
                    aria-expanded={menuOpen}
                    aria-controls="app-sidebar"
                    className="flex h-9 w-9 items-center justify-center rounded-md text-[#e8efe9]/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f]"
                >
                    <Menu className="h-5 w-5" aria-hidden="true" />
                </button>
                <img src={RentoraLight} className="block h-6 w-auto" alt="Rentora" />
            </header>

            <Sidebar mobileOpen={menuOpen} onMobileClose={closeMenu} />

            <main className="min-w-0 flex-1 bg-[#f7f9f7]">
                <Outlet />
            </main>
        </div>
    );
}

export default AppLayout;
