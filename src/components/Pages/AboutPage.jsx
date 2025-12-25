import React from "react";

export default function AboutPage() {
  return (
    <main className="max-w-4xl mx-auto p-6">
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
              Es veidoju satīna lentīšu ziedu pušķus ar lielu rūpību un mīlestību. Man patīk darboties ar rokām, radīt ko jaunu un ļaut idejām pārtapt skaistos, unikālos darbos. Katrs pušķis top nesteidzīgi, ar uzmanību pret detaļām un sirds siltumu.
Laika gaitā esmu lēnām augusi un pilnveidojusies, izveidojot daudzveidīgu darbu galeriju. Tajā ikviens var smelties iedvesmu un atrast sev piemērotāko – gan dāvanai, gan īpašiem dzīves mirkļiem.
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
              Mans radošais ceļš ziedu un pušķu veidošanā sākās pavisam personiski — ar manām kāzām. Toreiz vēl nestrādāju ar satīna lentēm, bet gan ar kreppapīru, un visas kāzu dekorācijas veidoju pati. Tajā brīdī sapratu, cik ļoti mani aizrauj radīšanas process un cik daudz prieka sniedz iespēja ar saviem darbiem radīt svētku sajūtu.
Ar ziedu veidošanu atkal sastapos Sieviešu dienā, strādājot kolektīvā, kurā esam tikai meitenes. Iedvesmojoties no video, kur no satīna lentēm tika veidotas skaistas rozes, nolēmu pamēģināt pati. Tā tapa mani pirmie satīna lentīšu pušķīši — katrai kolēģei kā neliela, sirsnīga dāvana.
Šie pušķi kļuva par sākumu kam lielākam. Kolēģes iedvesmojās un arvien biežāk lūdza izveidot pušķus dāvanām — vienu, otru, trešo reizi. Ar katru darbu pilnveidoju savas prasmes, meklēju jaunus risinājumus un dizainus, un pamazām mana aizraušanās pārtapa par mazu, sirds darbu pilnu biznesu.
Šodien katrs satīna pušķis top ar rūpību, mīlestību un vēlmi iepriecināt — jo skaistas lietas rodas tad, ja tās veido no sirds.
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

        <div className="mt-3 btn-group">
          <a className="btn btn-primary" href="/wa" target="_blank" rel="noreferrer">
            Rakstīt WhatsApp
          </a>
          <a className="btn btn-ghost" href="https://www.tiktok.com/@zanepoznaka" target="_blank" rel="noreferrer">
            TikTok
          </a>
        </div>
      </section>

    </main>
  );
}
