import React from "react";

export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <section
        className="mt-6 border rounded p-4"
        style={{ backgroundColor: "var(--panel)", borderColor: "var(--btn-ghost-border)" }}
      >
        <h1 className="text-2xl font-semibold">Privātums</h1>
        <p className="mt-2" style={{ color: "var(--muted)" }}>
          Īsā versija: mēs cenšamies ievākt pēc iespējas mazāk.
        </p>

        <div className="mt-4 space-y-4" style={{ color: "var(--text)" }}>
          <div>
            <h2 className="text-lg font-semibold">Saziņa</h2>
            <p className="mt-2">
              Ja rakstāt mums WhatsApp, sarakste notiek WhatsApp platformā. Mēs no vietnes
              puses speciāli neuzkrājam jūsu ziņojumus datubāzē.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Vēlmju saraksts</h2>
            <p className="mt-2">
              Ja neesat pieslēdzies, vēlmju saraksts var tikt saglabāts tikai jūsu ierīcē
              (pārlūkā). Ja pieslēdzaties, vēlmju saraksts tiek sinhronizēts ar jūsu kontu.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Pakalpojumu nodrošinātāji</h2>
            <p className="mt-2">
              Vietne izmanto Google Firebase, lai ielādētu lapu, glabātu produktu datus un
              attēlus. Saziņai varat izmantot WhatsApp (ārējs pakalpojums).
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Jautājumi</h2>
            <p className="mt-2">
              Ja ir jautājumi par privātumu, uzrakstiet mums (skat. “Par mani”).
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
