import type { Metadata } from "next";
import { PageHead } from "@/components/PageHead";

export const metadata: Metadata = { title: "Privātums" };

const SECTIONS: [string, string][] = [
  ["Kas ir atbildīgs par datiem", "Šī vietne (“Zanes Maģija”) izmanto Google Firebase infrastruktūru un WhatsApp saziņai. Ja ir jautājumi par privātumu, sazinieties ar mums sadaļā “Par mani”."],
  ["Reģistrācija nav vajadzīga", "Apmeklētājiem nav jāveido konts vai jāpieslēdzas. Pieslēgšanās (ar Google) ir tikai veikala administratoriem produktu pārvaldībai."],
  ["Saziņa", "Ja rakstāt mums WhatsApp, sarakste notiek WhatsApp platformā. Vietne jūsu ziņojumus neglabā."],
  ["Vēlmju saraksts", "Saglabātie darbi tiek glabāti tikai jūsu pārlūkā (localStorage) šajā ierīcē. Tie netiek sūtīti uz serveri, un tos var izdzēst, notīrot pārlūka datus."],
  ["Sīkdatnes un izsekošana", "Vietne neizmanto reklāmas, analītikas vai izsekošanas sīkdatnes."],
  ["Pakalpojumu nodrošinātāji", "Lapa, produktu dati un attēli tiek glabāti un piegādāti, izmantojot Google Firebase (ES serveri). Tehniskie žurnāli (piem., IP adrese) var tikt īslaicīgi apstrādāti drošības nolūkos."],
  ["Jūsu tiesības", "Jūs varat lūgt informāciju par saviem datiem vai to dzēšanu, sazinoties ar mums."],
];

export default function PrivacyPage() {
  return (
    <div className="wrap max-w-3xl">
      <PageHead eyebrow="Privātums" title="Privātuma politika">Īsumā: ievācam pēc iespējas mazāk un neizmantojam reklāmu vai izsekošanu.</PageHead>
      <div className="space-y-8">
        {SECTIONS.map(([h, t]) => (
          <section key={h}>
            <h2 className="text-lg font-semibold">{h}</h2>
            <p className="mt-2 text-ink-soft">{t}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
