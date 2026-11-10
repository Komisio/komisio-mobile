import type { Locale } from "./locale";
const copy: Record<
  Locale,
  {
    open: string;
    received: string;
    cancelled: string;
    receivedAt: string;
    view: string;
  }
> = {
  sv: {
    open: "Lämna in",
    received: "Mottagen",
    cancelled: "Inlämning avbruten",
    receivedAt: "Mottagen {date}",
    view: "Visa inlämningen",
  },
  en: {
    open: "Ready for drop-off",
    received: "Received",
    cancelled: "Handover cancelled",
    receivedAt: "Received {date}",
    view: "View handover",
  },
  no: {
    open: "Lever inn",
    received: "Mottatt",
    cancelled: "Innlevering avbrutt",
    receivedAt: "Mottatt {date}",
    view: "Vis innleveringen",
  },
  da: {
    open: "Aflevér varen",
    received: "Modtaget",
    cancelled: "Indlevering annulleret",
    receivedAt: "Modtaget {date}",
    view: "Vis indleveringen",
  },
  fi: {
    open: "Toimita tuote",
    received: "Vastaanotettu",
    cancelled: "Toimitus peruttu",
    receivedAt: "Vastaanotettu {date}",
    view: "Näytä toimitus",
  },
  de: {
    open: "Zur Abgabe bereit",
    received: "Eingegangen",
    cancelled: "Abgabe storniert",
    receivedAt: "Eingegangen am {date}",
    view: "Abgabe anzeigen",
  },
  es: {
    open: "Listo para entregar",
    received: "Recibido",
    cancelled: "Entrega cancelada",
    receivedAt: "Recibido el {date}",
    view: "Ver entrega",
  },
  it: {
    open: "Pronto per la consegna",
    received: "Ricevuto",
    cancelled: "Consegna annullata",
    receivedAt: "Ricevuto il {date}",
    view: "Vedi consegna",
  },
};
export const externalHandoverCopy = (locale: Locale) => copy[locale];
