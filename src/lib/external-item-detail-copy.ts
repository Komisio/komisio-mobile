import { centralSaleMethodCopy } from "./central-sale-method-copy.ts";
import type { Locale } from "./locale";

const sv = {
  title: "Om varan",
  requestedAmount: "Ditt önskade belopp",
  requestedResale: "Önskat försäljningspris",
  agreedAmount: "Ditt avtalade belopp",
  approvalGreeting: "Grattis! Komisio vill sälja din vara.",
  payoutTitle: "När kan jag få beloppet utbetalt?",
  payoutRule:
    "När varan säljs läggs {amount} till på ditt saldo. Om den är osåld får du beloppet 45 dagar efter att Komisio har tagit emot varan.",
  credited: "{amount} lades till på ditt saldo den {date}.",
  overdue:
    "Garantidatumet var den {date}. Vi har ännu ingen bekräftelse på att beloppet lagts till på ditt saldo.",
  noCreditInfo:
    "Vi har ingen uppgift om att beloppet för den här varan har lagts till på ditt saldo.",
  fromBalance: "Du kan begära utbetalning från ditt tillgängliga saldo.",
  offeredAmount: "Erbjudet belopp",
  noAmount: "Inget pris angivet",
  openOffer: "Visa erbjudande",
  openHandover: "Visa inlämning och frakt",
  loadError: "Varan kunde inte hämtas. Försök igen.",
  photoError: "Bilden kunde inte visas. Försök igen.",
  swipePhotos: "Svep åt sidan för att se fler bilder.",
};
type Copy = { [K in keyof typeof sv]: string };
const copies: Record<Locale, Copy> = {
  sv,
  en: {
    title: "About the item",
    requestedAmount: "Your requested amount",
    requestedResale: "Requested selling price",
    agreedAmount: "Your agreed amount",
    approvalGreeting: "Congratulations! Komisio would like to sell your item.",
    payoutTitle: "When can I request a payout?",
    payoutRule:
      "When the item sells, {amount} is added to your balance. If it remains unsold, you receive that amount 45 days after Komisio receives the item.",
    credited: "{amount} was added to your balance on {date}.",
    overdue:
      "The guarantee date was {date}. We still have no confirmation that the amount was added to your balance.",
    noCreditInfo: "There is no confirmed balance credit for this item here.",
    fromBalance: "You can request a payout from your available balance.",
    offeredAmount: "Offered amount",
    noAmount: "No price provided",
    openOffer: "View offer",
    openHandover: "View handover and shipping",
    loadError: "The item could not be loaded. Please retry.",
    photoError: "The photo could not be displayed. Please retry.",
    swipePhotos: "Swipe sideways to see more photos.",
  },
  no: {
    title: "Om varen",
    requestedAmount: "Ditt ønskede beløp",
    requestedResale: "Ønsket salgspris",
    agreedAmount: "Ditt avtalte beløp",
    approvalGreeting: "Gratulerer! Komisio vil selge varen din.",
    payoutTitle: "Når kan jeg få beløpet utbetalt?",
    payoutRule:
      "Når varen blir solgt, legges {amount} til saldoen din. Er den fortsatt usolgt, får du beløpet 45 dager etter at Komisio har mottatt varen.",
    credited: "{amount} ble lagt til saldoen din den {date}.",
    overdue:
      "Garantidatoen var {date}. Vi har ennå ingen bekreftelse på at beløpet er lagt til saldoen din.",
    noCreditInfo:
      "Vi har ingen bekreftelse på at beløpet for denne varen er lagt til saldoen din.",
    fromBalance: "Du kan be om utbetaling fra din tilgjengelige saldo.",
    offeredAmount: "Tilbudt beløp",
    noAmount: "Ingen pris oppgitt",
    openOffer: "Vis tilbud",
    openHandover: "Vis innlevering og frakt",
    loadError: "Varen kunne ikke hentes. Prøv igjen.",
    photoError: "Bildet kunne ikke vises. Prøv igjen.",
    swipePhotos: "Sveip til siden for å se flere bilder.",
  },
  da: {
    title: "Om varen",
    requestedAmount: "Dit ønskede beløb",
    requestedResale: "Ønsket salgspris",
    agreedAmount: "Dit aftalte beløb",
    approvalGreeting: "Tillykke! Komisio vil gerne sælge din vare.",
    payoutTitle: "Hvornår kan jeg få beløbet udbetalt?",
    payoutRule:
      "Når varen bliver solgt, bliver {amount} føjet til din saldo. Er den stadig usolgt, får du beløbet 45 dage efter, at Komisio har modtaget varen.",
    credited: "{amount} blev føjet til din saldo den {date}.",
    overdue:
      "Garantidatoen var den {date}. Vi har endnu ikke fået bekræftet, at beløbet er føjet til din saldo.",
    noCreditInfo:
      "Vi har ingen bekræftelse på, at beløbet for denne vare er føjet til din saldo.",
    fromBalance: "Du kan anmode om udbetaling fra din disponible saldo.",
    offeredAmount: "Tilbudt beløb",
    noAmount: "Ingen pris angivet",
    openOffer: "Vis tilbud",
    openHandover: "Vis indlevering og fragt",
    loadError: "Varen kunne ikke hentes. Prøv igen.",
    photoError: "Billedet kunne ikke vises. Prøv igen.",
    swipePhotos: "Stryg til siden for at se flere billeder.",
  },
  fi: {
    title: "Tuotteen tiedot",
    requestedAmount: "Toivomasi summa",
    requestedResale: "Toivottu myyntihinta",
    agreedAmount: "Sovittu summasi",
    approvalGreeting: "Onneksi olkoon! Komisio haluaa myydä tuotteesi.",
    payoutTitle: "Milloin voin pyytää maksua?",
    payoutRule:
      "Kun tuote myydään, saldoosi lisätään {amount}. Jos tuote jää myymättä, saat summan 45 päivän kuluttua siitä, kun Komisio on vastaanottanut tuotteen.",
    credited: "Saldoosi lisättiin {amount} {date}.",
    overdue:
      "Takuupäivä oli {date}. Emme ole vielä saaneet vahvistusta siitä, että summa on lisätty saldoosi.",
    noCreditInfo:
      "Tämän tuotteen summan lisäämisestä saldoosi ei ole vahvistusta.",
    fromBalance: "Voit pyytää maksua käytettävissä olevasta saldostasi.",
    offeredAmount: "Tarjottu summa",
    noAmount: "Hintaa ei ole annettu",
    openOffer: "Näytä tarjous",
    openHandover: "Näytä luovutus ja lähetys",
    loadError: "Tuotetta ei voitu ladata. Yritä uudelleen.",
    photoError: "Kuvaa ei voitu näyttää. Yritä uudelleen.",
    swipePhotos: "Katso lisää kuvia pyyhkäisemällä sivulle.",
  },
  de: {
    title: "Zum Artikel",
    requestedAmount: "Dein Wunschbetrag",
    requestedResale: "Gewünschter Verkaufspreis",
    agreedAmount: "Dein vereinbarter Betrag",
    approvalGreeting: "Glückwunsch! Komisio möchte deinen Artikel verkaufen.",
    payoutTitle: "Wann kann ich eine Auszahlung beantragen?",
    payoutRule:
      "Beim Verkauf werden deinem Guthaben {amount} gutgeschrieben. Bleibt der Artikel unverkauft, erhältst du den Betrag 45 Tage nach Eingang bei Komisio.",
    credited: "Am {date} wurden deinem Guthaben {amount} gutgeschrieben.",
    overdue:
      "Der Garantietermin war am {date}. Wir haben noch keine Bestätigung, dass der Betrag gutgeschrieben wurde.",
    noCreditInfo: "Für diesen Artikel liegt keine bestätigte Gutschrift vor.",
    fromBalance:
      "Du kannst eine Auszahlung aus deinem verfügbaren Guthaben beantragen.",
    offeredAmount: "Angebotener Betrag",
    noAmount: "Kein Preis angegeben",
    openOffer: "Angebot ansehen",
    openHandover: "Abgabe und Versand ansehen",
    loadError:
      "Der Artikel konnte nicht geladen werden. Bitte erneut versuchen.",
    photoError:
      "Das Foto konnte nicht angezeigt werden. Bitte erneut versuchen.",
    swipePhotos: "Zur Seite wischen, um weitere Fotos anzusehen.",
  },
  es: {
    title: "Sobre el artículo",
    requestedAmount: "El importe que solicitas",
    requestedResale: "Precio de venta solicitado",
    agreedAmount: "Tu importe acordado",
    approvalGreeting: "¡Enhorabuena! Komisio quiere vender tu artículo.",
    payoutTitle: "¿Cuándo puedo solicitar el pago?",
    payoutRule:
      "Cuando se venda el artículo, se añadirán {amount} a tu saldo. Si no se vende, recibirás ese importe 45 días después de que Komisio reciba el artículo.",
    credited: "Se añadieron {amount} a tu saldo el {date}.",
    overdue:
      "La fecha de garantía era el {date}. Aún no tenemos confirmación de que el importe se haya añadido a tu saldo.",
    noCreditInfo: "No consta ningún abono confirmado para este artículo.",
    fromBalance: "Puedes solicitar un pago con cargo a tu saldo disponible.",
    offeredAmount: "Importe ofrecido",
    noAmount: "Sin precio indicado",
    openOffer: "Ver oferta",
    openHandover: "Ver entrega y envío",
    loadError: "No se pudo cargar el artículo. Inténtalo de nuevo.",
    photoError: "No se pudo mostrar la foto. Inténtalo de nuevo.",
    swipePhotos: "Desliza hacia los lados para ver más fotos.",
  },
  it: {
    title: "Informazioni sull’articolo",
    requestedAmount: "L’importo che richiedi",
    requestedResale: "Prezzo di vendita richiesto",
    agreedAmount: "Il tuo importo concordato",
    approvalGreeting: "Congratulazioni! Komisio vuole vendere il tuo articolo.",
    payoutTitle: "Quando posso richiedere il pagamento?",
    payoutRule:
      "Quando l’articolo viene venduto, {amount} vengono aggiunti al tuo saldo. Se resta invenduto, ricevi l’importo 45 giorni dopo che Komisio ha ricevuto l’articolo.",
    credited: "Il {date} sono stati aggiunti {amount} al tuo saldo.",
    overdue:
      "La data di garanzia era il {date}. Non abbiamo ancora conferma che l’importo sia stato accreditato.",
    noCreditInfo: "Per questo articolo non risulta alcun accredito confermato.",
    fromBalance: "Puoi richiedere un pagamento dal saldo disponibile.",
    offeredAmount: "Importo offerto",
    noAmount: "Nessun prezzo indicato",
    openOffer: "Vedi offerta",
    openHandover: "Vedi consegna e spedizione",
    loadError: "Impossibile caricare l’articolo. Riprova.",
    photoError: "Impossibile mostrare la foto. Riprova.",
    swipePhotos: "Scorri lateralmente per vedere altre foto.",
  },
};

export function externalItemDetailCopy(locale: Locale) {
  return { ...copies[locale], ...centralSaleMethodCopy(locale) };
}
