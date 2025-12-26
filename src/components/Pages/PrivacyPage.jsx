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
          Īsā versija: mēs cenšamies ievākt pēc iespējas mazāk un neizmantojam reklāmu/izsekošanas pikseļus.
        </p>

        <div className="mt-4 space-y-4" style={{ color: "var(--text)" }}>
          <div>
            <h2 className="text-lg font-semibold">Kas ir atbildīgs par datiem</h2>
            <p className="mt-2">
              Šī vietne (“Zanes Pušķīši”) izmanto Google Firebase infrastruktūru un WhatsApp saziņai. Ja ir jautājumi par privātumu, sazinieties ar mums sadaļā “Par mani”.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Saziņa</h2>
            <p className="mt-2">
              Ja rakstāt mums WhatsApp, sarakste notiek WhatsApp platformā. Mēs no vietnes
              puses speciāli neuzkrājam jūsu ziņojumus datubāzē.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Pieslēgšanās (Google)</h2>
            <p className="mt-2">
              Ja izvēlaties pieslēgties ar Google, autentifikāciju apstrādā Google/Firebase Auth. Vietne var redzēt jūsu konta pamatdatus (piem., lietotāja ID, e‑pastu un profila attēlu), lai nodrošinātu pieslēgšanos un sinhronizāciju.
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
            <h2 className="text-lg font-semibold">Tehniskie dati un sīkdatnes</h2>
            <p className="mt-2">
              Vietne izmanto lokālo krātuvi (localStorage/sessionStorage) un PWA kešatmiņu, lai ātrāk ielādētu attēlus un saglabātu vēlmju sarakstu. Šie dati ir paredzēti vietnes darbībai (nevis reklāmu izsekošanai).
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
            <h2 className="text-lg font-semibold">Datu glabāšana un jūsu tiesības</h2>
            <p className="mt-2">
              Vēlmju saraksta dati tiek glabāti tikai tik ilgi, cik nepieciešams šīs funkcijas nodrošināšanai (ja pieslēgts — saistīti ar jūsu kontu; ja nepieslēgts — tikai jūsu ierīcē). Jūs varat lūgt piekļuvi vai dzēšanu, sazinoties ar mums sadaļā “Par mani”.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
