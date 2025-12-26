import React, { Suspense, useMemo } from "react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Hero from "./components/Home/Hero.jsx";
import ProductsGrid from "./components/Home/ProductsGrid.jsx";
import InspirationsGrid from "./components/Home/InspirationsGrid.jsx";
import AdminPanel from "./components/Home/AdminPanel.jsx";
import useAuth from "./hooks/useAuth";
import { isAdminUser } from "./utils/isAdminUid";

// App uses pathname-based routing (no react-router).

const ProductPage = React.lazy(() => import("./components/Pages/ProductPage.jsx"));
const InspirationPage = React.lazy(() => import("./components/Pages/InspirationPage.jsx"));
const WishlistPage = React.lazy(() => import("./components/Pages/WishlistPage.jsx"));
const AboutPage = React.lazy(() => import("./components/Pages/AboutPage.jsx"));
const PrivacyPage = React.lazy(() => import("./components/Pages/PrivacyPage.jsx"));

function App() {
  const { user } = useAuth();
  const isAdmin = isAdminUser(user);

  const path = useMemo(() => window.location.pathname, []);

  if (path === "/produkti") {
    return (
      <div>
        <Navbar />
        <Suspense fallback={<div className="p-6" style={{ color: "var(--muted)" }}>Ielādē...</div>}>
          <ProductPage user={user} />
        </Suspense>
        <Footer />
      </div>
    );
  }

  if (path === "/iedvesma") {
    return (
      <div>
        <Navbar />
        <Suspense fallback={<div className="p-6" style={{ color: "var(--muted)" }}>Ielādē...</div>}>
          <InspirationPage />
        </Suspense>
        <Footer />
      </div>
    );
  }

  if (path === "/wishlist") {
    return (
      <div>
        <Navbar />
        <Suspense fallback={<div className="p-6" style={{ color: "var(--muted)" }}>Ielādē...</div>}>
          <WishlistPage user={user} />
        </Suspense>
        <Footer />
      </div>
    );
  }

  if (path === "/par-mani" || path === "/about") {
    return (
      <div>
        <Navbar />
        <Suspense fallback={<div className="p-6" style={{ color: "var(--muted)" }}>Ielādē...</div>}>
          <AboutPage />
        </Suspense>
        <Footer />
      </div>
    );
  }

  if (path === "/privatums" || path === "/privacy") {
    return (
      <div>
        <Navbar />
        <Suspense fallback={<div className="p-6" style={{ color: "var(--muted)" }}>Ielādē...</div>}>
          <PrivacyPage />
        </Suspense>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <Hero />
      {isAdmin && <AdminPanel user={user} />}
      <ProductsGrid maxRows={3} user={user} />
      <InspirationsGrid maxRows={3} />
      <Footer />
    </div>
  );
}

export default App;
