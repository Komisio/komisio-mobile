import type { Locale } from "./locale.ts";

const copy = {
  sv: {
    methodTitle: "Hur vill du sälja din vara?",
    direct_purchase: "Sälj direkt till Komisio",
    directHint:
      "När vi tagit emot varan och kontrollerat skicket får du beloppet på ditt saldo och kan begära utbetalning.",
    consignment: "Låt Komisio sälja åt mig",
    consignmentHint:
      "Du får beloppet på ditt saldo när varan säljs, senast 45 dagar efter att vi tagit emot den.",
    decisionBeforeShipping: "Du får besked innan du skickar varan.",
    chooseMethod: "Välj hur du vill sälja din vara.",
    directApproval: "Grattis! Komisio vill köpa din vara.",
  },
  en: {
    methodTitle: "How would you like to sell your item?",
    direct_purchase: "Sell directly to Komisio",
    directHint:
      "Once we receive your item and check its condition, we credit your balance and you can request a payout.",
    consignment: "Let Komisio sell it for me",
    consignmentHint:
      "We credit your balance when the item sells, at the latest 45 days after we receive it.",
    decisionBeforeShipping: "We’ll let you know before you ship.",
    chooseMethod: "Choose how you would like to sell your item.",
    directApproval: "Congratulations! Komisio would like to buy your item.",
  },
  no: {
    methodTitle: "Hvordan vil du selge varen din?",
    direct_purchase: "Selg direkte til Komisio",
    directHint:
      "Når vi har mottatt varen og sjekket tilstanden, får du beløpet på saldoen din og kan be om utbetaling.",
    consignment: "La Komisio selge for meg",
    consignmentHint:
      "Du får beløpet på saldoen når varen blir solgt, senest 45 dager etter at vi har mottatt den.",
    decisionBeforeShipping: "Du får svar før du sender varen.",
    chooseMethod: "Velg hvordan du vil selge varen din.",
    directApproval: "Gratulerer! Komisio vil kjøpe varen din.",
  },
  da: {
    methodTitle: "Hvordan vil du sælge din vare?",
    direct_purchase: "Sælg direkte til Komisio",
    directHint:
      "Når vi har modtaget varen og kontrolleret standen, sættes beløbet på din saldo, og du kan bede om udbetaling.",
    consignment: "Lad Komisio sælge for mig",
    consignmentHint:
      "Beløbet sættes på din saldo, når varen sælges, senest 45 dage efter at vi har modtaget den.",
    decisionBeforeShipping: "Du får svar, før du sender varen.",
    chooseMethod: "Vælg, hvordan du vil sælge varen.",
    directApproval: "Tillykke! Komisio vil købe din vare.",
  },
  fi: {
    methodTitle: "Miten haluat myydä tuotteesi?",
    direct_purchase: "Myyn suoraan Komisiolle",
    directHint:
      "Kun olemme vastaanottaneet tuotteen ja tarkistaneet sen kunnon, summa lisätään saldoosi ja voit pyytää maksua.",
    consignment: "Annan Komision myydä puolestani",
    consignmentHint:
      "Summa lisätään saldoosi, kun tuote myydään, kuitenkin viimeistään 45 päivän kuluttua vastaanotosta.",
    decisionBeforeShipping: "Saat päätöksen ennen tuotteen lähettämistä.",
    chooseMethod: "Valitse, miten haluat myydä tuotteen.",
    directApproval: "Onneksi olkoon! Komisio haluaa ostaa tuotteesi.",
  },
  de: {
    methodTitle: "Wie möchtest du deinen Artikel verkaufen?",
    direct_purchase: "Direkt an Komisio verkaufen",
    directHint:
      "Sobald wir den Artikel erhalten und seinen Zustand geprüft haben, schreiben wir dir den Betrag gut. Dann kannst du die Auszahlung anfordern.",
    consignment: "Komisio für mich verkaufen lassen",
    consignmentHint:
      "Wir schreiben dir den Betrag beim Verkauf gut, spätestens 45 Tage nach Erhalt des Artikels.",
    decisionBeforeShipping:
      "Du erhältst Bescheid, bevor du den Artikel verschickst.",
    chooseMethod: "Wähle aus, wie du deinen Artikel verkaufen möchtest.",
    directApproval: "Glückwunsch! Komisio möchte deinen Artikel kaufen.",
  },
  es: {
    methodTitle: "¿Cómo quieres vender tu artículo?",
    direct_purchase: "Vender directamente a Komisio",
    directHint:
      "Cuando recibamos el artículo y comprobemos su estado, añadiremos el importe a tu saldo y podrás solicitar el pago.",
    consignment: "Que Komisio lo venda por mí",
    consignmentHint:
      "Añadiremos el importe a tu saldo cuando se venda el artículo, como máximo 45 días después de recibirlo.",
    decisionBeforeShipping: "Recibirás una respuesta antes de enviarlo.",
    chooseMethod: "Elige cómo quieres vender tu artículo.",
    directApproval: "¡Enhorabuena! Komisio quiere comprar tu artículo.",
  },
  it: {
    methodTitle: "Come vuoi vendere il tuo articolo?",
    direct_purchase: "Vendi direttamente a Komisio",
    directHint:
      "Quando avremo ricevuto l’articolo e verificato le sue condizioni, accrediteremo l’importo sul tuo saldo e potrai richiedere il pagamento.",
    consignment: "Lascia che Komisio venda per me",
    consignmentHint:
      "Riceverai l’importo sul saldo alla vendita, al più tardi 45 giorni dopo che avremo ricevuto l’articolo.",
    decisionBeforeShipping: "Riceverai una risposta prima di spedire.",
    chooseMethod: "Scegli come vuoi vendere il tuo articolo.",
    directApproval:
      "Congratulazioni! Komisio vuole acquistare il tuo articolo.",
  },
} satisfies Record<Locale, Record<string, string>>;

export const centralSaleMethodCopy = (locale: Locale) => copy[locale];
