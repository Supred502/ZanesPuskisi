import React, { useMemo, useState, useRef, useEffect } from "react";
import useAuth from "../hooks/useAuth";
import { authSignInWithGoogle, authSignOut } from "../stores/authStore";

export default function Navbar() {
  const { ready, optimisticUser, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);
  const moreRef = useRef(null);
  const [moreOpen, setMoreOpen] = useState(false);

  // Close menus when clicking outside or pressing Escape.
  useEffect(() => {
    function onPointerDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    }

    function onKeyDown(e) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setMoreOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const handleSignIn = async () => {
    try {
      await authSignInWithGoogle();
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await authSignOut();
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  // For header UX, prefer cached user immediately to avoid a login-button flash.
  // Only show the login button once Firebase state is resolved.
  const headerUser = useMemo(() => {
    return user || optimisticUser || null;
  }, [user, optimisticUser]);

  

  return (
    <header style={{ backgroundColor: 'var(--panel)', color: 'var(--text)' }}>
      <div className="py-4 sm:py-6 px-3 sm:px-4 flex items-center justify-between gap-3 max-w-6xl mx-auto">
        <a href="/" className="flex items-center min-w-0" aria-label="Home">
          <span
            className="header-logo truncate max-w-[55vw] sm:max-w-none"
            style={{
              fontSize: "clamp(26px, 6vw, 40px)",
              lineHeight: "1.1",
              paddingTop: "4px",
            }}
          >
            Zanes Pušķīši
          </span>
        </a>

        {/* Center navigation: visible on md and larger */}
        <nav className="hidden md:flex gap-6" aria-label="Main navigation">
          <a
            href="/"
            className="font-medium"
            onClick={(e) => {
              e.preventDefault();
              try {
                window.location.assign("/");
              } catch {
                window.location.href = "/";
              }
            }}
          >
            Sākums
          </a>
          <a
            href="/produkti"
            className="font-medium"
            onClick={(e) => {
              e.preventDefault();
              try {
                window.location.assign("/produkti");
              } catch {
                window.location.href = "/produkti";
              }
            }}
          >
            Produkti
          </a>
          <a
            href="/iedvesma"
            className="font-medium"
            onClick={(e) => {
              e.preventDefault();
              try {
                window.location.assign("/iedvesma");
              } catch {
                window.location.href = "/iedvesma";
              }
            }}
          >
            Iedvesma
          </a>
          <a
            href="/wishlist"
            className="font-medium"
            onClick={(e) => {
              e.preventDefault();
              try {
                window.location.assign("/wishlist");
              } catch {
                window.location.href = "/wishlist";
              }
            }}
          >
            Vēlmju saraksts
          </a>
          <a
            href="/par-mani"
            className="font-medium"
            onClick={(e) => {
              e.preventDefault();
              try {
                window.location.assign("/par-mani");
              } catch {
                window.location.href = "/par-mani";
              }
            }}
          >
            Par mani
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">

          {/* 'More' menu for small screens */}
          <div className="relative md:hidden" ref={moreRef} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="p-2 rounded"
              aria-label="Open more navigation"
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              aria-controls="more-menu"
              onClick={() => setMoreOpen((s) => !s)}
              title="More"
              style={{
                border: "1px solid var(--btn-ghost-border)",
                backgroundColor: "transparent",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>

            {moreOpen && (
              <div
                id="more-menu"
                role="menu"
                aria-label="More navigation"
                className="absolute right-0 mt-2 w-44 rounded shadow-md z-50 transform transition ease-out duration-150 origin-top-right"
                style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--btn-ghost-border)', color: 'var(--text)' }}
              >
                <div className="py-1">
                  <button role="menuitem" className="w-full text-left px-3 py-2" onClick={(e) => { setMoreOpen(false); e.preventDefault(); try { window.location.assign('/'); } catch { window.location.href = '/'; } }}>Sākums</button>
                  <button role="menuitem" className="w-full text-left px-3 py-2" onClick={(e) => { setMoreOpen(false); e.preventDefault(); try { window.location.assign('/produkti'); } catch { window.location.href = '/produkti'; } }}>Produkti</button>
                  <button role="menuitem" className="w-full text-left px-3 py-2" onClick={(e) => { setMoreOpen(false); e.preventDefault(); try { window.location.assign('/iedvesma'); } catch { window.location.href = '/iedvesma'; } }}>Iedvesma</button>
                  <button role="menuitem" className="w-full text-left px-3 py-2" onClick={(e) => { setMoreOpen(false); e.preventDefault(); try { window.location.assign('/wishlist'); } catch { window.location.href = '/wishlist'; } }}>Vēlmju saraksts</button>
                  <button role="menuitem" className="w-full text-left px-3 py-2" onClick={(e) => { setMoreOpen(false); e.preventDefault(); try { window.location.assign('/par-mani'); } catch { window.location.href = '/par-mani'; } }}>Par mani</button>
                </div>
              </div>
            )}
          </div>

          {/* Auth actions */}
          {!headerUser && !ready ? (
            <div
              className="w-10 h-10 rounded-full"
              aria-label="Auth loading"
              style={{
                backgroundColor: "var(--btn-ghost-hover-bg)",
                border: "1px solid var(--btn-ghost-border)",
              }}
            />
          ) : !headerUser ? (
            <button type="button" onClick={handleSignIn} className="btn btn-primary">
              <img src="/google.png" alt="Google" className="login-google-icon" />
              Pieslēgties
            </button>
          ) : (
            <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setMenuOpen((s) => !s)}
                className="w-10 h-10 rounded-full overflow-hidden avatar-button"
                title={headerUser.email || "Konts"}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {headerUser.photoURL ? (
                  <img src={headerUser.photoURL} alt="profile" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <span className="avatar-fallback">{(headerUser.email || "U")[0]}</span>
                )}
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded shadow-md z-50"
                  style={{ backgroundColor: "var(--panel)", border: "1px solid var(--btn-ghost-border)", color: "var(--text)" }}
                  ref={menuRef}
                  role="menu"
                  aria-label="Account options"
                >
                  <div className="p-2 text-sm" style={{ color: 'var(--muted)' }}>Pieslēdzies kā</div>
                  <div className="px-3 pb-2 font-medium flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path fill="#4285F4" d="M43.6 20.4H42V20H24v8h11.3C33.6 32 29.2 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c3 0 5.7 1.1 7.8 2.9l5.5-5.5C33 6.6 28.8 5 24 5 12.95 5 4 13.95 4 25s8.95 20 20 20 20-8.95 20-20c0-1.3-.12-2.6-.4-3.8z"/>
                      <path fill="#34A853" d="M6.3 14.7l6.4 4.7C14 16.4 18.6 13 24 13c3 0 5.7 1.1 7.8 2.9l5.5-5.5C33 6.6 28.8 5 24 5 16.2 5 9.1 8.7 6.3 14.7z"/>
                    </svg>
                    <span style={{ overflowWrap: 'anywhere' }}>{headerUser.email || "Konts"}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--btn-ghost-border)' }} />
                  <button type="button" onClick={handleSignOut} className="w-full text-left px-3 py-2" style={{ textAlign: 'left' }}>
                    Izrakstīties
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
