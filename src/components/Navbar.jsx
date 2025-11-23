import React, { useState, useRef, useEffect } from "react";
import { signOut, signInWithPopup, updateProfile } from "firebase/auth";
import { auth, googleProvider } from "../firebase/firebase";

export default function Navbar({ user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("theme") || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } catch {
      return "light";
    }
  });

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
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const handleChangeName = async () => {
    const current = auth.currentUser;
    if (!current) return;
    if (!newName) return;
    try {
      await updateProfile(current, { displayName: newName });
      setEditing(false);
      setMenuOpen(false);
      setNewName("");
    } catch (err) {
      console.error("Update profile failed:", err);
    }
  };

  // Toggle between 'light' and 'dark' theme and persist the choice.
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
      document.documentElement.classList.remove("theme-dark", "theme-light");
      document.documentElement.classList.add(`theme-${next}`);
    } catch {
      // ignore
    }
  };

  

  return (
    <header className="" style={{ backgroundColor: 'var(--panel)', color: 'var(--text)' }}>
      <div className="py-6 px-3 flex items-center justify-between max-w-6xl mx-auto">
        <a href="/" className="flex items-center" aria-label="Home">
          <span
            className="header-logo"
            style={{
              fontSize: '40px',
              lineHeight: '1.2',
              display: 'inline-block',
              paddingTop: '4px'
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
            href="/komentari"
            className="font-medium"
            onClick={(e) => {
              e.preventDefault();
              try {
                window.location.assign("/komentari");
              } catch {
                try {
                  window.location.assign("/comments");
                } catch {
                  window.location.href = "/comments";
                }
              }
            }}
          >
            Komentāri
          </a>
        </nav>

        <div className="flex items-center gap-4">
          {/* 'More' menu for small screens */}
          <div className="relative md:hidden" ref={moreRef} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Open more navigation"
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              aria-controls="more-menu"
              onClick={() => setMoreOpen((s) => !s)}
              title="More"
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
                  <button role="menuitem" className="w-full text-left px-3 py-2" onClick={(e) => { setMoreOpen(false); e.preventDefault(); try { window.location.assign('/komentari'); } catch { window.location.href = '/komentari'; } }}>Komentāri</button>
                </div>
              </div>
            )}
          </div>

          {/* Auth actions */}
          {!user ? (
            <button type="button" onClick={handleSignIn} className="btn btn-primary">
              <img src="/google.png" alt="Google" className="login-google-icon" />
              Pieslēgties
            </button>
          ) : (
            <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setMenuOpen((s) => !s)}
                className="w-10 h-10 rounded-full overflow-hidden avatar-button"
                title={user.displayName || user.email}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="avatar-fallback">{(user.displayName || user.email || "U")[0]}</span>
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
                    <span style={{ overflowWrap: 'anywhere' }}>{user.displayName || user.email}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--btn-ghost-border)' }} />
                  {!editing ? (
                    <>
                      <button type="button" onClick={() => { setEditing(true); setNewName(user.displayName || ""); }} className="w-full text-left px-3 py-2" style={{ textAlign: 'left' }}>Mainīt parādāmo vārdu</button>
                      <button type="button" onClick={handleSignOut} className="w-full text-left px-3 py-2" style={{ textAlign: 'left' }}>Izrakstīties</button>
                      <button type="button" onClick={toggleTheme} className="w-full text-left px-3 py-2" style={{ textAlign: 'left' }} title="Toggle light/dark theme">{theme === 'dark' ? 'Atspējot tumšo režīmu' : 'Ieslēgt tumšo režīmu'}</button>
                    </>
                  ) : (
                    <div className="p-3">
                      <label className="block text-sm text-gray-600 mb-1">Jauns parādāmais vārds</label>
                      <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full border px-2 py-1 rounded mb-2" />
                      <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setEditing(false)} className="px-3 py-1">Atcelt</button>
                        <button type="button" onClick={handleChangeName} className="px-3 py-1 bg-blue-600 text-white rounded">Saglabāt</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
