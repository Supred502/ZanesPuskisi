import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="wrap flex flex-1 flex-col items-center justify-center py-24 text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-2 font-display text-5xl">Šī lapa nav atrasta</h1>
        <p className="mt-3 text-ink-soft">Iespējams, darbs ir noņemts vai saite ir nepareiza.</p>
        <Link href="/produkti" className="btn btn-primary mt-8">Uz produktiem</Link>
      </main>
      <Footer />
    </>
  );
}
