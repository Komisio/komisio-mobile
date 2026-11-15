import type { Locale } from "./locale";
const sv = {
  title: "Lägg till e-postinloggning",
  intro:
    "Bekräfta en e-postadress och välj ett lösenord för ditt nuvarande konto. Har du redan ett annat konto med e-post? Logga ut och välj e-postinloggning på startsidan.",
  send: "Skicka bekräftelsemejl",
  sent: "Öppna länken i mejlet och kom sedan tillbaka hit.",
  check: "Jag har bekräftat e-postadressen",
  notConfirmed:
    "E-postadressen är inte bekräftad ännu. Öppna länken i mejlet och försök igen.",
  password: "Välj lösenord",
  passwordHint: "Minst 12 tecken. Använd gärna telefonens lösenordsförslag.",
  save: "Spara lösenord",
  done: "Klart! Du kan nu logga in med e-post och lösenord på samma konto.",
  conflict:
    "Adressen används redan av ett annat konto. För att använda det kontot: logga ut via Profil och logga sedan in med e-postkod. Dina varor på mobilkontot finns kvar. Kontona slås inte ihop.",
  failed:
    "Det gick inte att slutföra. Kontrollera anslutningen och försök igen.",
  invalid: "Ange en giltig e-postadress.",
  weak: "Välj ett starkare lösenord med minst 12 tecken.",
  reauth: "Bekräfta ändringen med en säkerhetskod till din e-postadress.",
  sendCode: "Skicka säkerhetskod",
  code: "Kod från mejlet",
  badCode:
    "Koden är felaktig eller har gått ut. Försök igen eller begär en ny.",
  wait: "Vänta en stund innan du skickar igen.",
};
type Copy = { [K in keyof typeof sv]: string };
const copies: Record<Locale, Copy> = {
  sv,
  en: {
    title: "Add email login",
    intro:
      "Confirm an email address and choose a password for your current account. Already have a different email account? Sign out and choose email login on the home screen.",
    send: "Send confirmation email",
    sent: "Open the link in the email, then return here.",
    check: "I have confirmed my email",
    notConfirmed:
      "Your email is not confirmed yet. Open the link in the email and try again.",
    password: "Choose a password",
    passwordHint:
      "At least 12 characters. You can use your phone's suggested password.",
    save: "Save password",
    done: "Done! You can now log in to the same account with email and password.",
    conflict:
      "This address belongs to another account. To use it, sign out from Profile, then log in with an email code. Items on your phone account stay there. The accounts are not merged.",
    failed: "Could not finish. Check your connection and try again.",
    invalid: "Enter a valid email address.",
    weak: "Choose a stronger password with at least 12 characters.",
    reauth: "Confirm this change with a security code sent to your email.",
    sendCode: "Send security code",
    code: "Code from the email",
    badCode: "The code is incorrect or expired. Try again or request another.",
    wait: "Please wait before sending again.",
  },
  no: {
    title: "Legg til e-postinnlogging",
    intro:
      "Bekreft en e-postadresse og velg et passord for kontoen du bruker nå. Har du en annen konto med e-post? Logg ut og velg e-postinnlogging på startsiden.",
    send: "Send bekreftelse på e-post",
    sent: "Åpne lenken i e-posten og kom tilbake hit.",
    check: "Jeg har bekreftet e-postadressen",
    notConfirmed:
      "E-postadressen er ikke bekreftet ennå. Åpne lenken og prøv igjen.",
    password: "Velg passord",
    passwordHint: "Minst 12 tegn. Bruk gjerne telefonens passordforslag.",
    save: "Lagre passord",
    done: "Ferdig! Du kan logge inn på samme konto med e-post og passord.",
    conflict:
      "Adressen brukes av en annen konto. Logg ut via Profil og logg deretter inn med e-postkode for å bruke den. Varene på mobilkontoen blir der. Kontoene slås ikke sammen.",
    failed: "Kunne ikke fullføre. Sjekk forbindelsen og prøv igjen.",
    invalid: "Oppgi en gyldig e-postadresse.",
    weak: "Velg et sterkere passord med minst 12 tegn.",
    reauth: "Bekreft endringen med en sikkerhetskode til e-posten din.",
    sendCode: "Send sikkerhetskode",
    code: "Kode fra e-posten",
    badCode: "Koden er feil eller utløpt. Prøv igjen eller be om en ny.",
    wait: "Vent litt før du sender igjen.",
  },
  da: {
    title: "Tilføj e-mail-login",
    intro:
      "Bekræft en e-mailadresse, og vælg en adgangskode til din nuværende konto. Har du en anden konto med e-mail? Log ud, og vælg e-mail-login på startsiden.",
    send: "Send bekræftelsesmail",
    sent: "Åbn linket i mailen, og vend tilbage hertil.",
    check: "Jeg har bekræftet min e-mail",
    notConfirmed:
      "Din e-mail er ikke bekræftet endnu. Åbn linket, og prøv igen.",
    password: "Vælg adgangskode",
    passwordHint: "Mindst 12 tegn. Brug gerne telefonens forslag.",
    save: "Gem adgangskode",
    done: "Klar! Du kan logge ind på samme konto med e-mail og adgangskode.",
    conflict:
      "Adressen bruges af en anden konto. Log ud via Profil, og log derefter ind med e-mailkode for at bruge den. Varerne på mobilkontoen bliver der. Kontiene slås ikke sammen.",
    failed: "Kunne ikke fuldføre. Tjek forbindelsen, og prøv igen.",
    invalid: "Angiv en gyldig e-mailadresse.",
    weak: "Vælg en stærkere adgangskode med mindst 12 tegn.",
    reauth: "Bekræft ændringen med en sikkerhedskode til din e-mail.",
    sendCode: "Send sikkerhedskode",
    code: "Kode fra mailen",
    badCode: "Koden er forkert eller udløbet. Prøv igen, eller bed om en ny.",
    wait: "Vent lidt, før du sender igen.",
  },
  fi: {
    title: "Lisää sähköpostikirjautuminen",
    intro:
      "Vahvista sähköpostiosoite ja valitse salasana nykyiselle tilillesi. Onko sinulla jo toinen sähköpostitili? Kirjaudu ulos ja valitse aloitusnäytöltä sähköpostikirjautuminen.",
    send: "Lähetä vahvistusviesti",
    sent: "Avaa sähköpostin linkki ja palaa tänne.",
    check: "Olen vahvistanut sähköpostini",
    notConfirmed:
      "Sähköpostia ei ole vielä vahvistettu. Avaa viestin linkki ja yritä uudelleen.",
    password: "Valitse salasana",
    passwordHint:
      "Vähintään 12 merkkiä. Voit käyttää puhelimen ehdottamaa salasanaa.",
    save: "Tallenna salasana",
    done: "Valmista! Voit kirjautua samalle tilille sähköpostilla ja salasanalla.",
    conflict:
      "Osoite kuuluu toiselle tilille. Kirjaudu ulos Profiilissa ja kirjaudu sitten sisään sähköpostikoodilla. Puhelintilisi tuotteet säilyvät siellä. Tilejä ei yhdistetä.",
    failed: "Toiminto epäonnistui. Tarkista yhteys ja yritä uudelleen.",
    invalid: "Anna kelvollinen sähköpostiosoite.",
    weak: "Valitse vahvempi salasana, jossa on vähintään 12 merkkiä.",
    reauth: "Vahvista muutos sähköpostiin lähetettävällä turvakoodilla.",
    sendCode: "Lähetä turvakoodi",
    code: "Sähköpostin koodi",
    badCode: "Koodi on väärä tai vanhentunut. Yritä uudelleen tai pyydä uusi.",
    wait: "Odota hetki ennen uutta lähetystä.",
  },
  de: {
    title: "E-Mail-Anmeldung hinzufügen",
    intro:
      "Bestätige eine E-Mail-Adresse und wähle ein Passwort für dein aktuelles Konto. Hast du bereits ein anderes Konto mit E-Mail? Melde dich ab und wähle die E-Mail-Anmeldung auf der Startseite.",
    send: "Bestätigungsmail senden",
    sent: "Öffne den Link in der E-Mail und kehre hierher zurück.",
    check: "Ich habe meine E-Mail bestätigt",
    notConfirmed:
      "Deine E-Mail ist noch nicht bestätigt. Öffne den Link und versuche es erneut.",
    password: "Passwort wählen",
    passwordHint:
      "Mindestens 12 Zeichen. Du kannst den Passwortvorschlag deines Telefons verwenden.",
    save: "Passwort speichern",
    done: "Fertig! Du kannst dich mit E-Mail und Passwort im selben Konto anmelden.",
    conflict:
      "Diese Adresse gehört zu einem anderen Konto. Melde dich unter Profil ab und dann mit einem E-Mail-Code an. Die Artikel in deinem Telefonkonto bleiben dort. Die Konten werden nicht zusammengeführt.",
    failed:
      "Abschluss fehlgeschlagen. Prüfe die Verbindung und versuche es erneut.",
    invalid: "Gib eine gültige E-Mail-Adresse ein.",
    weak: "Wähle ein stärkeres Passwort mit mindestens 12 Zeichen.",
    reauth: "Bestätige die Änderung mit einem Sicherheitscode per E-Mail.",
    sendCode: "Sicherheitscode senden",
    code: "Code aus der E-Mail",
    badCode:
      "Der Code ist falsch oder abgelaufen. Versuche es erneut oder fordere einen neuen an.",
    wait: "Warte kurz, bevor du erneut sendest.",
  },
  es: {
    title: "Añadir acceso por correo",
    intro:
      "Confirma un correo y elige una contraseña para tu cuenta actual. ¿Ya tienes otra cuenta con correo? Cierra sesión y elige el acceso por correo en la pantalla de inicio.",
    send: "Enviar correo de confirmación",
    sent: "Abre el enlace del correo y vuelve aquí.",
    check: "He confirmado mi correo",
    notConfirmed:
      "El correo aún no está confirmado. Abre el enlace e inténtalo de nuevo.",
    password: "Elige una contraseña",
    passwordHint:
      "Al menos 12 caracteres. Puedes usar la sugerencia de tu teléfono.",
    save: "Guardar contraseña",
    done: "¡Listo! Ya puedes entrar en la misma cuenta con correo y contraseña.",
    conflict:
      "Esta dirección pertenece a otra cuenta. Cierra sesión en Perfil y accede con un código por correo. Los artículos de tu cuenta de teléfono permanecen allí. Las cuentas no se fusionan.",
    failed: "No se pudo completar. Comprueba la conexión e inténtalo de nuevo.",
    invalid: "Introduce un correo válido.",
    weak: "Elige una contraseña más segura de al menos 12 caracteres.",
    reauth:
      "Confirma el cambio con un código de seguridad enviado a tu correo.",
    sendCode: "Enviar código de seguridad",
    code: "Código del correo",
    badCode:
      "El código es incorrecto o ha caducado. Inténtalo de nuevo o solicita otro.",
    wait: "Espera un momento antes de volver a enviar.",
  },
  it: {
    title: "Aggiungi accesso con e-mail",
    intro:
      "Conferma un indirizzo e-mail e scegli una password per il tuo account attuale. Hai già un altro account con e-mail? Esci e scegli l’accesso con e-mail dalla schermata iniziale.",
    send: "Invia e-mail di conferma",
    sent: "Apri il link nell'e-mail e torna qui.",
    check: "Ho confermato la mia e-mail",
    notConfirmed: "L'e-mail non è ancora confermata. Apri il link e riprova.",
    password: "Scegli una password",
    passwordHint:
      "Almeno 12 caratteri. Puoi usare la password suggerita dal telefono.",
    save: "Salva password",
    done: "Fatto! Puoi accedere allo stesso account con e-mail e password.",
    conflict:
      "Questo indirizzo appartiene a un altro account. Esci da Profilo e accedi con un codice via e-mail. Gli articoli del tuo account telefonico restano lì. Gli account non vengono uniti.",
    failed: "Impossibile completare. Controlla la connessione e riprova.",
    invalid: "Inserisci un indirizzo e-mail valido.",
    weak: "Scegli una password più sicura di almeno 12 caratteri.",
    reauth:
      "Conferma la modifica con un codice di sicurezza inviato via e-mail.",
    sendCode: "Invia codice di sicurezza",
    code: "Codice dell'e-mail",
    badCode: "Il codice è errato o scaduto. Riprova o richiedine un altro.",
    wait: "Attendi un momento prima di inviare di nuovo.",
  },
};
export const emailLoginCopy = (locale: Locale) => copies[locale];
export function emailLoginError(locale: Locale, code: string) {
  const t = copies[locale];
  if (code === "email_exists") return t.conflict;
  if (code === "email_address_invalid") return t.invalid;
  if (code === "EMAIL_NOT_CONFIRMED") return t.notConfirmed;
  if (code === "weak_password" || code === "same_password") return t.weak;
  if (code === "reauthentication_needed") return t.reauth;
  if (code === "reauthentication_not_valid") return t.badCode;
  if (code.startsWith("over_")) return t.wait;
  return t.failed;
}
