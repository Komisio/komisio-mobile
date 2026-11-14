import type { Locale } from "./locale";

type Copy = {
  title: string;
  intro: string;
  without: string;
  enabled: string;
  back: string;
};
export const submissionNotificationsCopy: Record<Locale, Copy> = {
  sv: {
    back: "Tillbaka",
    title: "Få besked när Komisio svarar",
    intro:
      "Aktivera notiser så får du veta när Komisio ger dig ett erbjudande eller avvisar varan. Du kan alltid se svaret i Mina varor.",
    without: "Skicka in utan notiser",
    enabled: "Notiser är aktiverade. Nu kan du skicka in varan.",
  },
  en: {
    back: "Back",
    title: "Know when Komisio replies",
    intro:
      "Enable notifications to hear when Komisio makes an offer or declines your item. You can always see the reply in My items.",
    without: "Submit without notifications",
    enabled: "Notifications are on. You can now submit your item.",
  },
  no: {
    back: "Tilbake",
    title: "Få beskjed når Komisio svarer",
    intro:
      "Aktiver varsler for å få beskjed når Komisio gir deg et tilbud eller avviser varen. Du kan alltid se svaret i Mine varer.",
    without: "Send inn uten varsler",
    enabled: "Varsler er aktivert. Nå kan du sende inn varen.",
  },
  da: {
    back: "Tilbage",
    title: "Få besked, når Komisio svarer",
    intro:
      "Aktivér notifikationer, så du får besked, når Komisio giver dig et tilbud eller afviser varen. Du kan altid se svaret i Mine varer.",
    without: "Send ind uden notifikationer",
    enabled: "Notifikationer er aktiveret. Nu kan du sende varen ind.",
  },
  fi: {
    back: "Takaisin",
    title: "Saat tiedon Komision vastauksesta",
    intro:
      "Ota ilmoitukset käyttöön, niin saat tiedon, kun Komisio tekee tarjouksen tai hylkää tuotteesi. Näet vastauksen aina Omat tuotteet -näkymässä.",
    without: "Lähetä ilman ilmoituksia",
    enabled:
      "Ilmoitukset ovat käytössä. Voit nyt lähettää tuotteesi arvioitavaksi.",
  },
  de: {
    back: "Zurück",
    title: "Erfahre, wenn Komisio antwortet",
    intro:
      "Aktiviere Benachrichtigungen, damit du erfährst, wenn Komisio ein Angebot macht oder deinen Artikel ablehnt. Du findest die Antwort jederzeit unter Meine Artikel.",
    without: "Ohne Benachrichtigungen einsenden",
    enabled:
      "Benachrichtigungen sind aktiviert. Du kannst deinen Artikel jetzt einsenden.",
  },
  es: {
    back: "Atrás",
    title: "Recibe la respuesta de Komisio",
    intro:
      "Activa las notificaciones para saber cuándo Komisio te hace una oferta o rechaza tu artículo. Siempre puedes ver la respuesta en Mis artículos.",
    without: "Enviar sin notificaciones",
    enabled:
      "Las notificaciones están activadas. Ya puedes enviar tu artículo.",
  },
  it: {
    back: "Indietro",
    title: "Scopri quando Komisio risponde",
    intro:
      "Attiva le notifiche per sapere quando Komisio fa un'offerta o rifiuta il tuo articolo. Puoi sempre vedere la risposta in I miei articoli.",
    without: "Invia senza notifiche",
    enabled: "Le notifiche sono attive. Ora puoi inviare il tuo articolo.",
  },
};
