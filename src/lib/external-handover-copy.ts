import type { Locale } from "./locale";
const copy: Record<
  Locale,
  {
    open: string;
    received: string;
    cancelled: string;
    receivedAt: string;
    view: string;
    due: string;
  }
> = {
  sv: {
    due: "{amount} till ditt saldo när varan säljs, senast {date}.",
    open: "Lämna in",
    received: "Mottagen",
    cancelled: "Inlämning avbruten",
    receivedAt: "Mottagen {date}",
    view: "Visa inlämningen",
  },
  en: {
    due: "{amount} added to your balance when the item sells, no later than {date}.",
    open: "Ready for drop-off",
    received: "Received",
    cancelled: "Handover cancelled",
    receivedAt: "Received {date}",
    view: "View handover",
  },
  no: {
    due: "{amount} på saldoen din når varen selges, senest {date}.",
    open: "Lever inn",
    received: "Mottatt",
    cancelled: "Innlevering avbrutt",
    receivedAt: "Mottatt {date}",
    view: "Vis innleveringen",
  },
  da: {
    due: "{amount} på din saldo, når varen sælges, senest {date}.",
    open: "Aflevér varen",
    received: "Modtaget",
    cancelled: "Indlevering annulleret",
    receivedAt: "Modtaget {date}",
    view: "Vis indleveringen",
  },
  fi: {
    due: "{amount} saldollesi tuotteen myynnin yhteydessä, viimeistään {date}.",
    open: "Toimita tuote",
    received: "Vastaanotettu",
    cancelled: "Toimitus peruttu",
    receivedAt: "Vastaanotettu {date}",
    view: "Näytä toimitus",
  },
  de: {
    due: "{amount} auf dein Guthaben beim Verkauf, spätestens am {date}.",
    open: "Zur Abgabe bereit",
    received: "Eingegangen",
    cancelled: "Abgabe storniert",
    receivedAt: "Eingegangen am {date}",
    view: "Abgabe anzeigen",
  },
  es: {
    due: "{amount} en tu saldo cuando se venda el artículo, como máximo el {date}.",
    open: "Listo para entregar",
    received: "Recibido",
    cancelled: "Entrega cancelada",
    receivedAt: "Recibido el {date}",
    view: "Ver entrega",
  },
  it: {
    due: "{amount} sul tuo saldo alla vendita, entro il {date}.",
    open: "Pronto per la consegna",
    received: "Ricevuto",
    cancelled: "Consegna annullata",
    receivedAt: "Ricevuto il {date}",
    view: "Vedi consegna",
  },
};
export const externalHandoverCopy = (locale: Locale) => copy[locale];
