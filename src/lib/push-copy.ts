import type { Locale } from "./locale";

type Copy = {
  title: string;
  intro: string;
  on: string;
  off: string;
  enable: string;
  disable: string;
  denied: string;
  settings: string;
  unavailable: string;
  failed: string;
  registered: string;
  sold: string;
};
export const pushCopy: Record<Locale, Copy> = {
  sv: {
    title: "Notiser",
    intro:
      "Få besked om dina förfrågningar till Komisio. Du kan också få notiser när varor registreras eller säljs i butiker som har aktiverat det.",
    on: "På för den här telefonen",
    off: "Av för den här telefonen",
    enable: "Aktivera notiser",
    disable: "Stäng av notiser",
    denied: "Notiser är blockerade i telefonens inställningar.",
    settings: "Öppna telefonens inställningar",
    unavailable: "Notiser finns i Komisio-appen på en fysisk telefon.",
    failed:
      "Inställningen kunde inte bekräftas. Kontrollera anslutningen och försök igen.",
    registered: "Registrerade varor",
    sold: "Sålda varor",
  },
  en: {
    title: "Notifications",
    intro:
      "Get updates on your requests to Komisio. You can also receive item registration and sale notifications from stores that enable them.",
    on: "On for this phone",
    off: "Off for this phone",
    enable: "Enable notifications",
    disable: "Turn off notifications",
    denied: "Notifications are blocked in your phone settings.",
    settings: "Open phone settings",
    unavailable:
      "Notifications are available in the Komisio app on a physical phone.",
    failed:
      "The setting could not be confirmed. Check your connection and try again.",
    registered: "Registered items",
    sold: "Sold items",
  },
  no: {
    title: "Varsler",
    intro:
      "Få svar på forespørslene dine til Komisio. Du kan også få varsler når varer registreres eller selges i butikker som har aktivert dette.",
    on: "På for denne telefonen",
    off: "Av for denne telefonen",
    enable: "Aktiver varsler",
    disable: "Slå av varsler",
    denied: "Varsler er blokkert i telefonens innstillinger.",
    settings: "Åpne telefonens innstillinger",
    unavailable:
      "Varsler er tilgjengelige i Komisio-appen på en fysisk telefon.",
    failed:
      "Innstillingen kunne ikke bekreftes. Sjekk tilkoblingen og prøv igjen.",
    registered: "Registrerte varer",
    sold: "Solgte varer",
  },
  da: {
    title: "Notifikationer",
    intro:
      "Få svar på dine forespørgsler til Komisio. Du kan også få notifikationer, når varer registreres eller sælges i butikker, der har aktiveret det.",
    on: "Til på denne telefon",
    off: "Fra på denne telefon",
    enable: "Aktivér notifikationer",
    disable: "Slå notifikationer fra",
    denied: "Notifikationer er blokeret i telefonens indstillinger.",
    settings: "Åbn telefonens indstillinger",
    unavailable:
      "Notifikationer er tilgængelige i Komisio-appen på en fysisk telefon.",
    failed:
      "Indstillingen kunne ikke bekræftes. Kontrollér forbindelsen, og prøv igen.",
    registered: "Registrerede varer",
    sold: "Solgte varer",
  },
  fi: {
    title: "Ilmoitukset",
    intro:
      "Saat vastaukset Komisiolle lähettämiisi pyyntöihin. Voit myös saada ilmoituksia tuotteiden rekisteröinnistä ja myynnistä liikkeiltä, jotka ovat ottaneet ne käyttöön.",
    on: "Käytössä tässä puhelimessa",
    off: "Pois käytöstä tässä puhelimessa",
    enable: "Ota ilmoitukset käyttöön",
    disable: "Poista ilmoitukset käytöstä",
    denied: "Ilmoitukset on estetty puhelimen asetuksissa.",
    settings: "Avaa puhelimen asetukset",
    unavailable:
      "Ilmoitukset ovat käytettävissä Komisio-sovelluksessa fyysisellä puhelimella.",
    failed: "Asetusta ei voitu vahvistaa. Tarkista yhteys ja yritä uudelleen.",
    registered: "Rekisteröidyt tuotteet",
    sold: "Myydyt tuotteet",
  },
  de: {
    title: "Mitteilungen",
    intro:
      "Erhalte Antworten auf deine Anfragen an Komisio. Geschäfte können dich außerdem über die Erfassung und den Verkauf deiner Artikel benachrichtigen.",
    on: "Für dieses Telefon aktiviert",
    off: "Für dieses Telefon deaktiviert",
    enable: "Mitteilungen aktivieren",
    disable: "Mitteilungen deaktivieren",
    denied: "Mitteilungen sind in den Telefoneinstellungen blockiert.",
    settings: "Telefoneinstellungen öffnen",
    unavailable:
      "Mitteilungen sind in der Komisio-App auf einem physischen Telefon verfügbar.",
    failed:
      "Die Einstellung konnte nicht bestätigt werden. Prüfe die Verbindung und versuche es erneut.",
    registered: "Erfasste Artikel",
    sold: "Verkaufte Artikel",
  },
  es: {
    title: "Notificaciones",
    intro:
      "Recibe respuestas a tus solicitudes a Komisio. También puedes recibir avisos de registro y venta de las tiendas que los activen.",
    on: "Activadas en este teléfono",
    off: "Desactivadas en este teléfono",
    enable: "Activar notificaciones",
    disable: "Desactivar notificaciones",
    denied: "Las notificaciones están bloqueadas en los ajustes del teléfono.",
    settings: "Abrir ajustes del teléfono",
    unavailable:
      "Las notificaciones están disponibles en la app Komisio en un teléfono físico.",
    failed:
      "No se pudo confirmar el ajuste. Comprueba la conexión e inténtalo de nuevo.",
    registered: "Artículos registrados",
    sold: "Artículos vendidos",
  },
  it: {
    title: "Notifiche",
    intro:
      "Ricevi risposte alle tue richieste a Komisio. Puoi anche ricevere notifiche di registrazione e vendita dai negozi che le attivano.",
    on: "Attive su questo telefono",
    off: "Disattivate su questo telefono",
    enable: "Attiva notifiche",
    disable: "Disattiva notifiche",
    denied: "Le notifiche sono bloccate nelle impostazioni del telefono.",
    settings: "Apri le impostazioni del telefono",
    unavailable:
      "Le notifiche sono disponibili nell’app Komisio su un telefono fisico.",
    failed:
      "Impossibile confermare l’impostazione. Controlla la connessione e riprova.",
    registered: "Articoli registrati",
    sold: "Articoli venduti",
  },
};
