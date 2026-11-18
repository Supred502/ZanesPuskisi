import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a href="#saturs" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 btn btn-ghost">Uz saturu</a>
      <Header />
      <main id="saturs" className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
