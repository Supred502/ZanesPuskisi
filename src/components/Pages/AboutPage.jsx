import React from "react";

export default function AboutPage() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <header>
        <h1 className="text-2xl font-bold">Par mani</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Šī lapa ir paredzēta īsam stāstam par tevi un Zanes Pušķīšiem.
        </p>
      </header>

      <section
        className="mt-6 border rounded p-4"
        style={{ backgroundColor: "var(--panel)", borderColor: "var(--btn-ghost-border)" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="w-full">
            <img
              src="/Work_Station.jpeg?v=20251221"
              alt="Darbnīcas foto"
              className="w-full rounded"
              loading="lazy"
              decoding="async"
              style={{ border: "1px solid var(--btn-ghost-border)", backgroundColor: "var(--hero-bg)" }}
            />
            <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
              Aizkulises: vieta, kur top pušķi un dekori.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Roku darbs ar mīlestību</h2>
            <p className="mt-2" style={{ color: "var(--text)" }}>
              Mani produkti ir roku darbs — katrs pušķis tiek veidots individuāli, rūpīgi piemeklējot
              krāsas, kompozīciju un detaļas. Iedvesmu smeļos sezonās, noskaņās un jūsu idejās — lai
              rezultāts ir īpašs un tieši jums piemērots.
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              Ja vēlies līdzīgu darbu citās krāsās vai izmērā, uzraksti — pielāgošu pasūtījumu.
            </p>
          </div>
        </div>
      </section>

      <section
        className="mt-6 border rounded p-4"
        style={{ backgroundColor: "var(--panel)", borderColor: "var(--btn-ghost-border)" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="w-full">
            <img
              src="/Me.jpg?v=20251221"
              alt="Foto"
              className="w-full rounded"
              loading="lazy"
              decoding="async"
              style={{ border: "1px solid var(--btn-ghost-border)", backgroundColor: "var(--hero-bg)" }}
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold">Mans stāsts</h2>
            <p className="mt-2" style={{ color: "var(--text)" }}>
              Uzraksti pāris teikumus par sevi: kā sākās aizraušanās ar pušķu veidošanu, kas tevi
              iedvesmo, un ko cilvēki var sagaidīt no taviem darbiem.
            </p>
          </div>
        </div>
      </section>

      <section
        className="mt-4 border rounded p-4"
        style={{ backgroundColor: "var(--panel)", borderColor: "var(--btn-ghost-border)" }}
      >
        <h2 className="text-lg font-semibold">Ko es piedāvāju</h2>
        <ul className="mt-2 list-disc pl-5" style={{ color: "var(--text)" }}>
          <li>Pušķi svētkiem un ikdienai</li>
          <li>Individuāli pasūtījumi (krāsas, stils, budžets)</li>
          <li>Dāvanu noformējums</li>
        </ul>
      </section>

      <section
        className="mt-4 border rounded p-4"
        style={{ backgroundColor: "var(--panel)", borderColor: "var(--btn-ghost-border)" }}
      >
        <h2 className="text-lg font-semibold">Kontakti</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Pievieno ērtāko saziņas veidu (piem., Instagram, WhatsApp vai e-pastu).
        </p>

        <div className="mt-3 btn-group">
          <a className="btn btn-primary" href="/wa" target="_blank" rel="noreferrer">
            Rakstīt WhatsApp
          </a>
          <a className="btn btn-ghost" href="https://www.tiktok.com/@zanepoznaka" target="_blank" rel="noreferrer">
            TikTok
          </a>
        </div>
      </section>

      <p className="mt-6 text-xs" style={{ color: "var(--muted)" }}>
        Piezīme: nomaini tekstu un saites uz savām.
      </p>
    </main>
  );
}
