import type { Locale } from "./locale.ts";

const copy = {
  sv: {
    payoutQuestion: "När får jag mina pengar?",
    payoutTiming:
      "Oftast startar vi din Swish-utbetalning så snart vi har tagit emot och kontrollerat varan.",
    payoutOnSale:
      "Säljer vi varan åt dig startar utbetalningen när den säljs, senast 45 dagar efter att vi tog emot den.",
    payoutRequest:
      "När beloppet finns på ditt saldo skapar Komisio automatiskt en utbetalningsbegäran till ditt valda Swish-nummer eller bankkonto. Du kan följa den under Pengar.",
    receiptApproval: "Grattis! Komisio har godkänt din vara.",
    receiptPending:
      "När vi har tagit emot och kontrollerat varan ser du här när beloppet blir tillgängligt.",
    direct_purchase: "Sälj direkt till Komisio",
    directHint:
      "När vi tagit emot varan och kontrollerat skicket får du beloppet på ditt saldo och kan begära utbetalning.",
    consignment: "Låt Komisio sälja åt mig",
    consignmentHint:
      "Du får beloppet på ditt saldo när varan säljs, senast 45 dagar efter att vi tagit emot den.",
    directApproval: "Grattis! Komisio vill köpa din vara.",
  },
  en: {
    payoutQuestion: "When do I get paid?",
    payoutTiming:
      "We usually start your Swish payout as soon as we receive and check your item.",
    payoutOnSale:
      "If we sell the item for you, we start your payout when it sells, no later than 45 days after we receive it.",
    payoutRequest:
      "When your balance is credited, Komisio automatically requests a payout to your chosen Swish number or bank account. You can follow it under Money.",
    receiptApproval: "Congratulations! Komisio has approved your item.",
    receiptPending:
      "Once we receive and check your item, you’ll see here when your money becomes available.",
    direct_purchase: "Sell directly to Komisio",
    directHint:
      "Once we receive your item and check its condition, we credit your balance and you can request a payout.",
    consignment: "Let Komisio sell it for me",
    consignmentHint:
      "We credit your balance when the item sells, at the latest 45 days after we receive it.",
    directApproval: "Congratulations! Komisio would like to buy your item.",
  },
  no: {
    payoutQuestion: "Når får jeg pengene?",
    payoutTiming:
      "Som regel starter vi utbetalingen via Swish så snart vi har mottatt og sjekket varen.",
    payoutOnSale:
      "Selger vi varen for deg, starter utbetalingen når den blir solgt, senest 45 dager etter at vi mottok den.",
    payoutRequest:
      "Når saldoen din godskrives, oppretter Komisio automatisk en utbetalingsforespørsel til valgt Swish-nummer eller bankkonto. Følg den under Penger.",
    receiptApproval: "Gratulerer! Komisio har godkjent varen din.",
    receiptPending:
      "Når vi har mottatt og kontrollert varen, ser du her når beløpet blir tilgjengelig.",
    direct_purchase: "Selg direkte til Komisio",
    directHint:
      "Når vi har mottatt varen og sjekket tilstanden, får du beløpet på saldoen din og kan be om utbetaling.",
    consignment: "La Komisio selge for meg",
    consignmentHint:
      "Du får beløpet på saldoen når varen blir solgt, senest 45 dager etter at vi har mottatt den.",
    directApproval: "Gratulerer! Komisio vil kjøpe varen din.",
  },
  da: {
    payoutQuestion: "Hvornår får jeg mine penge?",
    payoutTiming:
      "Som regel starter vi din udbetaling via Swish, så snart vi har modtaget og tjekket varen.",
    payoutOnSale:
      "Sælger vi varen for dig, starter udbetalingen, når den bliver solgt, dog senest 45 dage efter at vi modtog den.",
    payoutRequest:
      "Når beløbet tilføjes din saldo, opretter Komisio automatisk en udbetalingsanmodning til dit valgte Swish-nummer eller din bankkonto. Følg den under Penge.",
    receiptApproval: "Tillykke! Komisio har godkendt din vare.",
    receiptPending:
      "Når vi har modtaget og kontrolleret varen, kan du se her, hvornår beløbet bliver tilgængeligt.",
    direct_purchase: "Sælg direkte til Komisio",
    directHint:
      "Når vi har modtaget varen og kontrolleret standen, sættes beløbet på din saldo, og du kan bede om udbetaling.",
    consignment: "Lad Komisio sælge for mig",
    consignmentHint:
      "Beløbet sættes på din saldo, når varen sælges, senest 45 dage efter at vi har modtaget den.",
    directApproval: "Tillykke! Komisio vil købe din vare.",
  },
  fi: {
    payoutQuestion: "Milloin saan rahani?",
    payoutTiming:
      "Yleensä käynnistämme Swish-maksun heti, kun olemme vastaanottaneet ja tarkistaneet tuotteesi.",
    payoutOnSale:
      "Jos myymme tuotteen puolestasi, käynnistämme maksun myynnin yhteydessä, viimeistään 45 päivän kuluttua tuotteen vastaanottamisesta.",
    payoutRequest:
      "Kun summa lisätään saldoosi, Komisio luo automaattisesti maksupyynnön valitsemaasi Swish-numeroon tai pankkitilille. Voit seurata sitä Raha-osiossa.",
    receiptApproval: "Onneksi olkoon! Komisio on hyväksynyt tuotteesi.",
    receiptPending:
      "Kun olemme vastaanottaneet ja tarkistaneet tuotteen, näet täältä, milloin summa on käytettävissä.",
    direct_purchase: "Myyn suoraan Komisiolle",
    directHint:
      "Kun olemme vastaanottaneet tuotteen ja tarkistaneet sen kunnon, summa lisätään saldoosi ja voit pyytää maksua.",
    consignment: "Annan Komision myydä puolestani",
    consignmentHint:
      "Summa lisätään saldoosi, kun tuote myydään, kuitenkin viimeistään 45 päivän kuluttua vastaanotosta.",
    directApproval: "Onneksi olkoon! Komisio haluaa ostaa tuotteesi.",
  },
  de: {
    payoutQuestion: "Wann bekomme ich mein Geld?",
    payoutTiming:
      "Meist veranlassen wir deine Auszahlung per Swish, sobald wir deinen Artikel erhalten und geprüft haben.",
    payoutOnSale:
      "Verkaufen wir den Artikel für dich, veranlassen wir die Auszahlung beim Verkauf, spätestens 45 Tage nach Erhalt.",
    payoutRequest:
      "Sobald der Betrag gutgeschrieben ist, erstellt Komisio automatisch einen Auszahlungsauftrag für deine Swish-Nummer oder dein Bankkonto. Unter Geld kannst du ihn verfolgen.",
    receiptApproval: "Glückwunsch! Komisio hat deinen Artikel angenommen.",
    receiptPending:
      "Nach Eingang und Prüfung deines Artikels siehst du hier, wann der Betrag verfügbar ist.",
    direct_purchase: "Direkt an Komisio verkaufen",
    directHint:
      "Sobald wir den Artikel erhalten und seinen Zustand geprüft haben, schreiben wir dir den Betrag gut. Dann kannst du die Auszahlung anfordern.",
    consignment: "Komisio für mich verkaufen lassen",
    consignmentHint:
      "Wir schreiben dir den Betrag beim Verkauf gut, spätestens 45 Tage nach Erhalt des Artikels.",
    directApproval: "Glückwunsch! Komisio möchte deinen Artikel kaufen.",
  },
  es: {
    payoutQuestion: "¿Cuándo recibiré mi dinero?",
    payoutTiming:
      "Normalmente iniciamos el pago por Swish en cuanto recibimos y revisamos tu artículo.",
    payoutOnSale:
      "Si lo vendemos por ti, iniciamos el pago cuando se venda, como máximo 45 días después de recibirlo.",
    payoutRequest:
      "Cuando el importe se abone en tu saldo, Komisio creará automáticamente una solicitud de pago a tu número Swish o cuenta bancaria. Puedes seguirla en Dinero.",
    receiptApproval: "¡Enhorabuena! Komisio ha aceptado tu artículo.",
    receiptPending:
      "Cuando recibamos y revisemos tu artículo, verás aquí cuándo estará disponible el importe.",
    direct_purchase: "Vender directamente a Komisio",
    directHint:
      "Cuando recibamos el artículo y comprobemos su estado, añadiremos el importe a tu saldo y podrás solicitar el pago.",
    consignment: "Que Komisio lo venda por mí",
    consignmentHint:
      "Añadiremos el importe a tu saldo cuando se venda el artículo, como máximo 45 días después de recibirlo.",
    directApproval: "¡Enhorabuena! Komisio quiere comprar tu artículo.",
  },
  it: {
    payoutQuestion: "Quando riceverò i miei soldi?",
    payoutTiming:
      "Di solito avviamo il pagamento tramite Swish appena riceviamo e controlliamo il tuo articolo.",
    payoutOnSale:
      "Se lo vendiamo per te, avviamo il pagamento al momento della vendita, al più tardi 45 giorni dopo averlo ricevuto.",
    payoutRequest:
      "Quando l’importo viene accreditato sul saldo, Komisio crea automaticamente una richiesta di pagamento al numero Swish o al conto bancario scelto. Puoi seguirla nella sezione Soldi.",
    receiptApproval: "Congratulazioni! Komisio ha approvato il tuo articolo.",
    receiptPending:
      "Dopo la ricezione e il controllo dell’articolo, qui vedrai quando l’importo sarà disponibile.",
    direct_purchase: "Vendi direttamente a Komisio",
    directHint:
      "Quando avremo ricevuto l’articolo e verificato le sue condizioni, accrediteremo l’importo sul tuo saldo e potrai richiedere il pagamento.",
    consignment: "Lascia che Komisio venda per me",
    consignmentHint:
      "Riceverai l’importo sul saldo alla vendita, al più tardi 45 giorni dopo che avremo ricevuto l’articolo.",
    directApproval:
      "Congratulazioni! Komisio vuole acquistare il tuo articolo.",
  },
} satisfies Record<Locale, Record<string, string>>;

export const centralSaleMethodCopy = (locale: Locale) => copy[locale];
