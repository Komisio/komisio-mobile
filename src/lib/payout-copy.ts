const sv = {
  title: "Utbetalningar",
  request: "Begär utbetalning",
  history: "Utbetalningshistorik",
  notice:
    "Butiken granskar din begäran och hanterar bankutbetalningen. En begäran gör ingen banköverföring och reserverar inte saldot förrän den godkänns.",
  amount: "Belopp ({currency})",
  useAll: "Använd hela saldot",
  threshold: "Minsta utbetalning",
  submit: "Bekräfta begäran",
  invalid: "Ange ett positivt belopp med högst två decimaler.",
  below: "Beloppet understiger butikens minsta utbetalning.",
  above: "Beloppet är större än ditt tillgängliga saldo.",
  insufficient:
    "Du kan begära utbetalning när ditt tillgängliga saldo når butikens minsta belopp.",
  empty: "Du har inga utbetalningsbegäranden ännu.",
  failed: "Utbetalningarna kunde inte hämtas. Försök igen.",
  denied: "Du har inte längre tillgång till detta säljarkonto.",
  notConfigured:
    "Det går inte att begära utbetalning i appen just nu. Använd säljarportalen eller kontakta butiken.",
  pending:
    "Vi väntar på bekräftelse av den här begäran. Försök med samma begäran igen innan du gör en ny.",
  retrySame: "Försök med samma begäran igen",
  saved:
    "Din begäran är registrerad. Uppdatera historiken för att se butikens aktuella hantering.",
  changed:
    "Saldot eller minsta beloppet har ändrats. Läs in aktuella uppgifter innan du begär igen.",
  cleanupSuccess:
    "Begäran har registrerats, men appen behöver avsluta den lokala hanteringen innan du gör en ny.",
  cleanupConflict:
    "Begäran kunde inte registreras med det beloppet. Avsluta den lokala hanteringen och läs in aktuella uppgifter.",
  finish: "Avsluta begäran",
  refresh: "Uppdatera utbetalningar",
  unsupported:
    "Den här webbläsaren kan inte spara begäranden säkert. Använd säljarportalen.",
  previous: "Föregående sida",
  next: "Nästa sida",
  page: "Sida {page} av {pages} · {total} begäranden",
  first: "Till första sidan",
  pastEnd: "Det finns inga begäranden på den här sidan.",
};
const en: typeof sv = {
  title: "Payouts",
  request: "Request a payout",
  history: "Payout history",
  notice:
    "The store reviews your request and handles the bank payout. A request does not transfer money or reserve the balance until approved.",
  amount: "Amount ({currency})",
  useAll: "Use full balance",
  threshold: "Minimum payout",
  submit: "Confirm request",
  invalid: "Enter a positive amount with at most two decimal places.",
  below: "The amount is below the store's minimum payout.",
  above: "The amount exceeds your available balance.",
  insufficient:
    "You can request a payout when your available balance reaches the store's minimum amount.",
  empty: "You have no payout requests yet.",
  failed: "Payouts could not be loaded. Try again.",
  denied: "You no longer have access to this seller account.",
  notConfigured:
    "Payout requests are not available in the app right now. Use the seller portal or contact the store.",
  pending:
    "This request is awaiting confirmation. Retry the same request before making another one.",
  retrySame: "Retry the same request",
  saved:
    "Your request is registered. Refresh the history to see the store's current handling.",
  changed:
    "The balance or minimum amount changed. Load the current details before requesting again.",
  cleanupSuccess:
    "The request was registered, but the app needs to finish its local record before you make another one.",
  cleanupConflict:
    "The request could not be registered for that amount. Finish its local record and load the current details.",
  finish: "Finish request",
  refresh: "Refresh payouts",
  unsupported:
    "This browser cannot safely store payout requests. Use the seller portal.",
  previous: "Previous page",
  next: "Next page",
  page: "Page {page} of {pages} · {total} requests",
  first: "Go to first page",
  pastEnd: "There are no requests on this page.",
};
export const payoutCopy = { sv, en };
