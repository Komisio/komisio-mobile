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
    open: "Skicka varan",
    received: "Mottagen",
    cancelled: "Inlämning avbruten",
    receivedAt: "Mottagen {date}",
    view: "Visa frakten",
  },
  en: {
    due: "{amount} added to your balance when the item sells, no later than {date}.",
    open: "Ready to ship",
    received: "Received",
    cancelled: "Handover cancelled",
    receivedAt: "Received {date}",
    view: "View shipping",
  },
  no: {
    due: "{amount} på saldoen din når varen selges, senest {date}.",
    open: "Send varen",
    received: "Mottatt",
    cancelled: "Innlevering avbrutt",
    receivedAt: "Mottatt {date}",
    view: "Vis frakten",
  },
  da: {
    due: "{amount} på din saldo, når varen sælges, senest {date}.",
    open: "Send varen",
    received: "Modtaget",
    cancelled: "Indlevering annulleret",
    receivedAt: "Modtaget {date}",
    view: "Vis fragten",
  },
  fi: {
    due: "{amount} saldollesi tuotteen myynnin yhteydessä, viimeistään {date}.",
    open: "Lähetä tuote",
    received: "Vastaanotettu",
    cancelled: "Toimitus peruttu",
    receivedAt: "Vastaanotettu {date}",
    view: "Näytä lähetys",
  },
  de: {
    due: "{amount} auf dein Guthaben beim Verkauf, spätestens am {date}.",
    open: "Versandbereit",
    received: "Eingegangen",
    cancelled: "Abgabe storniert",
    receivedAt: "Eingegangen am {date}",
    view: "Versand anzeigen",
  },
  es: {
    due: "{amount} en tu saldo cuando se venda el artículo, como máximo el {date}.",
    open: "Listo para enviar",
    received: "Recibido",
    cancelled: "Entrega cancelada",
    receivedAt: "Recibido el {date}",
    view: "Ver envío",
  },
  it: {
    due: "{amount} sul tuo saldo alla vendita, entro il {date}.",
    open: "Pronto da spedire",
    received: "Ricevuto",
    cancelled: "Consegna annullata",
    receivedAt: "Ricevuto il {date}",
    view: "Vedi spedizione",
  },
};
export const externalHandoverCopy = (locale: Locale) => copy[locale];
