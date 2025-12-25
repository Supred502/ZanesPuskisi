import React from "react";

export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <section
        className="mt-6 border rounded p-4"
        style={{ backgroundColor: "var(--panel)", borderColor: "var(--btn-ghost-border)" }}
      >
        <h1 className="text-2xl font-semibold">Privātuma politika</h1>
        <p className="mt-2" style={{ color: "var(--muted)" }}>
          Pēdējoreiz atjaunināts: 2025-12-25
        </p>

        <div className="mt-4 space-y-4" style={{ color: "var(--text)" }}>
          <p>
            Šī privātuma politika paskaidro, kā mēs apstrādājam personas datus, kad jūs
            izmantojat vietni “Zanes Pušķīši”.
          </p>

          <div>
            <h2 className="text-lg font-semibold">Kādus datus mēs ievācam</h2>
            <ul className="mt-2 list-disc pl-5">
              <li>
                Saziņa: ja izvēlaties rakstīt mums WhatsApp, jūsu ziņa tiks apstrādāta
                WhatsApp platformā.
              </li>
              <li>
                Tehniskie dati: pārlūkprogrammas tehniskā informācija un tīkla pieprasījuma
                metadati (piem., IP adrese) var tikt apstrādāti infrastruktūras līmenī.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Kāpēc mēs tos izmantojam</h2>
            <ul className="mt-2 list-disc pl-5">
              <li>Lai atbildētu uz jūsu pieprasījumu par produktu/pasūtījumu.</li>
              <li>Lai aizsargātu vietni pret ļaunprātīgu izmantošanu (piem., spamu).</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Glabāšanas termiņš</h2>
            <p className="mt-2">
              Vietne parasti neuzglabā jūsu WhatsApp ziņojumu saturu. Ziņojumu glabāšana
              ir atkarīga no WhatsApp iestatījumiem un politikas. Ja vēlaties, varat
              sazināties ar mums par jebkādiem jautājumiem.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Datu saņēmēji</h2>
            <p className="mt-2">
              Vietne izmanto Google Firebase (hosting, datubāze un attēlu glabāšana), lai
              nodrošinātu pakalpojumu. Saziņai jūs varat izmantot WhatsApp (ārējs pakalpojums).
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Jūsu tiesības</h2>
            <p className="mt-2">
              Jums ir tiesības pieprasīt piekļuvi saviem datiem, labošanu vai dzēšanu.
              Sazinieties ar mums, izmantojot kontaktus vietnē “Par mani”.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Sīkdatnes</h2>
            <p className="mt-2">
              Vietne var izmantot tehniskās sīkdatnes, lai nodrošinātu funkcionalitāti
              (piem., vēlmju saraksta saglabāšanai lokāli jūsu ierīcē, ja neesat
              pieslēdzies).
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
