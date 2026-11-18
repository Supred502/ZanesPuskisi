import type { Metadata } from "next";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { PageHead } from "@/components/PageHead";
import { TIKTOK_URL, waHref } from "@/lib/site";

export const metadata: Metadata = { title: "Par mani", description: "Kā radās Zanes Maģija: roku darbi, kas top ar rūpību un sirdi." };

export default function AboutPage() {
  return (
    <div className="wrap max-w-5xl">
      <PageHead eyebrow="Par mani" title="Roku darbs ar mīlestību" />

      <section className="grid items-start gap-8 md:grid-cols-2">
        <Photo src="/darbnica.jpeg" alt="Darbnīca, kur top pušķi un dekori" caption="Aizkulises: vieta, kur top pušķi un dekori." />
        <div className="space-y-4 text-lg text-ink-soft">
          <p>Es veidoju satīna lentīšu ziedu pušķus ar lielu rūpību un mīlestību. Man patīk darboties ar rokām, radīt ko jaunu un ļaut idejām pārtapt skaistos, unikālos darbos. Katrs pušķis top nesteidzīgi, ar uzmanību pret detaļām un sirds siltumu.</p>
          <p>Laika gaitā esmu lēnām augusi un pilnveidojusies, izveidojot daudzveidīgu darbu galeriju. Tajā ikviens var smelties iedvesmu un atrast sev piemērotāko: gan dāvanai, gan īpašiem dzīves mirkļiem.</p>
        </div>
      </section>

      <section className="mt-16 grid items-start gap-8 md:grid-cols-2">
        <div className="space-y-4 text-ink-soft md:order-2">
          <h2 className="font-display text-4xl leading-[1.2] text-ink md:text-5xl">Mans stāsts</h2>
          <p>Mans radošais ceļš ziedu un pušķu veidošanā sākās pavisam personiski: ar manām kāzām. Toreiz vēl nestrādāju ar satīna lentēm, bet gan ar krepapīru, un visas kāzu dekorācijas veidoju pati. Tajā brīdī sapratu, cik ļoti mani aizrauj radīšanas process un cik daudz prieka sniedz iespēja ar saviem darbiem radīt svētku sajūtu.</p>
          <p>Ar ziedu veidošanu atkal sastapos Sieviešu dienā, strādājot kolektīvā, kurā esam tikai meitenes. Iedvesmojoties no video, kur no satīna lentēm tika veidotas skaistas rozes, nolēmu pamēģināt pati. Tā tapa mani pirmie satīna lentīšu pušķīši: katrai kolēģei kā neliela, sirsnīga dāvana.</p>
          <p>Šie pušķi kļuva par sākumu kam lielākam. Kolēģes iedvesmojās un arvien biežāk lūdza izveidot pušķus dāvanām. Ar katru darbu pilnveidoju savas prasmes, meklēju jaunus risinājumus un dizainus, un pamazām mana aizraušanās pārtapa par mazu, sirds darbu pilnu biznesu.</p>
          <p className="text-xl font-medium text-gold italic">Skaistas lietas rodas tad, ja tās veido no sirds.</p>
        </div>
        <Photo src="/zane.jpg" alt="Zane" />
      </section>

      <section className="card mt-16 grid gap-8 p-6 sm:p-10 md:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl">Ko es piedāvāju</h2>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-ink-soft">
            <li>Satīna lentīšu pušķi un ziedi</li>
            <li>Dāvanas un dekori svētkiem un ikdienai</li>
            <li>Individuāli pasūtījumi (krāsas, stils, budžets)</li>
            <li>Dāvanu noformējums</li>
          </ul>
        </div>
        <div>
          <h2 className="font-display text-4xl">Sazinies</h2>
          <p className="mt-4 text-ink-soft">Raksti, un kopā izdomāsim tieši tev piemērotu darbu.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a className="btn btn-primary" href={waHref()} target="_blank" rel="noopener"><MessageCircle className="size-4" aria-hidden />Rakstīt WhatsApp</a>
            <a className="btn btn-ghost" href={TIKTOK_URL} target="_blank" rel="noopener">TikTok</a>
          </div>
        </div>
      </section>
    </div>
  );
}

function Photo({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure>
      <div className="relative aspect-[4/5] overflow-hidden rounded-card border border-line bg-soft">
        <Image src={src} alt={alt} fill sizes="(min-width: 768px) 480px, 100vw" className="object-cover" />
      </div>
      {caption && <figcaption className="mt-2 text-sm text-ink-soft">{caption}</figcaption>}
    </figure>
  );
}
