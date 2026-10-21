import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Outlet } from "react-router";
import { Menu } from "lucide-react";
import Sidebar from "../components/navigation/Sidebar";
import RentoraLight from "../assets/rentora-wordmark-light.svg";

// Tailwind's md breakpoint: from here up the sidebar is always shown and there is no drawer.
const DESKTOP_QUERY = "(min-width: 48rem)";

function AppLayout() {
    // Phones only: whether the sidebar drawer is open. From md up the sidebar is always shown.
    const [menuOpen, setMenuOpen] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    function closeMenu() {
        // The menu button is inert while the drawer is open, so the close is applied first to let it take focus back.
        flushSync(() => setMenuOpen(false));
        menuButtonRef.current?.focus();
    }

    // While the drawer is open the page behind it doesn't scroll. Widening the window to md closes it,
    // since from there on there is no drawer to close and the page would otherwise stay inert.
    useEffect(() => {
        if (!menuOpen) return;

        const root = document.documentElement;
        const previousOverflow = root.style.overflow;
        root.style.overflow = "hidden";

        const desktop = window.matchMedia(DESKTOP_QUERY);
        const closeOnDesktop = () => {
            if (desktop.matches) setMenuOpen(false);
        };
        desktop.addEventListener("change", closeOnDesktop);

        return () => {
            root.style.overflow = previousOverflow;
            desktop.removeEventListener("change", closeOnDesktop);
        };
    }, [menuOpen]);

    return (
        <div className="min-h-screen md:flex">
            {/* While the drawer is open, everything but the drawer is inert: no focus, clicks or screen reader access,
                so Tab only moves between the drawer's links. */}
            <header inert={menuOpen} className="sticky top-0 z-30 flex items-center gap-3 bg-[#14302b] px-4 py-3 md:hidden">
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

            <main inert={menuOpen} className="min-w-0 flex-1 bg-[#f7f9f7]">
                <Outlet />
            </main>
        </div>
    );
}

export default AppLayout;
