import type { Locale } from "./locale";
const sv = {
  title: "Inloggning med e-post",
  intro:
    "Bekräfta din e-postadress och välj ett lösenord. Nästa gång kan du logga in utan SMS. Dina varor finns kvar på samma konto.",
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
    "Adressen används redan av ett annat konto. Använd en annan adress, eller logga in på det andra kontot. Kontona slås inte ihop.",
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
    title: "Email login",
    intro:
      "Confirm your email and choose a password. Next time, log in without SMS. Your items stay on the same account.",
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
      "This address belongs to another account. Use another address, or log in to that account. Accounts are not merged.",
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
    title: "Innlogging med e-post",
    intro:
      "Bekreft e-postadressen og velg et passord. Neste gang kan du logge inn uten SMS. Varene blir på samme konto.",
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
      "Adressen tilhører en annen konto. Bruk en annen adresse, eller logg inn på den kontoen. Kontoene slås ikke sammen.",
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
    title: "Login med e-mail",
    intro:
      "Bekræft din e-mail, og vælg en adgangskode. Næste gang kan du logge ind uden SMS. Dine varer bliver på samme konto.",
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
      "Adressen tilhører en anden konto. Brug en anden adresse, eller log ind på den konto. Konti sammenlægges ikke.",
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
    title: "Kirjautuminen sähköpostilla",
    intro:
      "Vahvista sähköpostisi ja valitse salasana. Jatkossa voit kirjautua ilman tekstiviestiä. Tavarat pysyvät samalla tilillä.",
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
      "Osoite kuuluu toiselle tilille. Käytä muuta osoitetta tai kirjaudu sille tilille. Tilejä ei yhdistetä.",
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
    title: "Anmeldung mit E-Mail",
    intro:
      "Bestätige deine E-Mail und wähle ein Passwort. Danach kannst du dich ohne SMS anmelden. Deine Artikel bleiben im selben Konto.",
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
      "Die Adresse gehört zu einem anderen Konto. Verwende eine andere Adresse oder melde dich dort an. Konten werden nicht zusammengeführt.",
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
    title: "Acceso con correo electrónico",
    intro:
      "Confirma tu correo y elige una contraseña. Después podrás entrar sin SMS. Tus artículos siguen en la misma cuenta.",
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
      "La dirección pertenece a otra cuenta. Usa otra dirección o entra en esa cuenta. Las cuentas no se fusionan.",
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
    title: "Accesso con e-mail",
    intro:
      "Conferma la tua e-mail e scegli una password. Poi potrai accedere senza SMS. Gli articoli restano sullo stesso account.",
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
      "L'indirizzo appartiene a un altro account. Usa un altro indirizzo o accedi a quell'account. Gli account non vengono uniti.",
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
