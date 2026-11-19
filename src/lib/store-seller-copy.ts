import type { Locale } from "./locale";

const sv = {
  selectedStore: "Vald butik",
  chooseAnother: "Välj annan butik",
  handInInfo: "Inlämning och butiksinformation",
  photosOff:
    "Butiken tar inte emot varuförslag digitalt. Kontakta butiken inför inlämning.",
  existingSeller: "Redan säljare i butiken?",
  signInHint:
    "Logga in med den e-postadress du använder hos butiken för att se dina varor.",
  newSeller: "Bli säljare i butiken",
  contactStore:
    "Kontakta butiken för att bli registrerad som säljare och få veta hur du lämnar in. Butikens villkor gäller.",
};
type Copy = { [K in keyof typeof sv]: string };
export const storeSellerCopy: Record<Locale, Copy> = {
  sv,
  en: {
    selectedStore: "Selected store",
    chooseAnother: "Choose another store",
    handInInfo: "Drop-off and store information",
    photosOff:
      "This store does not accept photo submissions. Contact the store before bringing in your items.",
    existingSeller: "Already a seller at this store?",
    signInHint:
      "Sign in with the email address you use at the store to see your items.",
    newSeller: "Become a seller at this store",
    contactStore:
      "Contact the store to register as a seller and find out how to consign items. The store's terms apply.",
  },
  no: {
    selectedStore: "Valgt butikk",
    chooseAnother: "Velg en annen butikk",
    handInInfo: "Innlevering og butikkinformasjon",
    photosOff:
      "Butikken tar ikke imot digitale vareforslag. Kontakt butikken før innlevering.",
    existingSeller: "Allerede selger i butikken?",
    signInHint:
      "Logg inn med e-postadressen du bruker hos butikken for å se varene dine.",
    newSeller: "Bli selger i butikken",
    contactStore:
      "Kontakt butikken for å bli registrert som selger og få vite hvordan du leverer inn. Butikkens vilkår gjelder.",
  },
  da: {
    selectedStore: "Valgt butik",
    chooseAnother: "Vælg en anden butik",
    handInInfo: "Indlevering og butiksinformation",
    photosOff:
      "Butikken modtager ikke digitale vareforslag. Kontakt butikken inden indlevering.",
    existingSeller: "Er du allerede sælger i butikken?",
    signInHint:
      "Log ind med den e-mailadresse, du bruger hos butikken, for at se dine varer.",
    newSeller: "Bliv sælger i butikken",
    contactStore:
      "Kontakt butikken for at blive registreret som sælger og høre, hvordan du indleverer. Butikkens vilkår gælder.",
  },
  fi: {
    selectedStore: "Valittu liike",
    chooseAnother: "Valitse toinen liike",
    handInInfo: "Tavaroiden tuonti ja liikkeen tiedot",
    photosOff:
      "Liike ei ota vastaan tuote-ehdotuksia digitaalisesti. Ota yhteyttä liikkeeseen ennen tavaroiden tuontia.",
    existingSeller: "Oletko jo myyjä tässä liikkeessä?",
    signInHint:
      "Kirjaudu liikkeessä käyttämälläsi sähköpostiosoitteella nähdäksesi tavarasi.",
    newSeller: "Ryhdy liikkeen myyjäksi",
    contactStore:
      "Ota yhteyttä liikkeeseen rekisteröityäksesi myyjäksi ja saadaksesi tavaroiden toimitusohjeet. Liikkeen ehdot ovat voimassa.",
  },
  de: {
    selectedStore: "Ausgewähltes Geschäft",
    chooseAnother: "Anderes Geschäft wählen",
    handInInfo: "Abgabe und Geschäftsinformationen",
    photosOff:
      "Dieses Geschäft nimmt keine digitalen Artikelvorschläge an. Kontaktieren Sie es vor der Abgabe.",
    existingSeller: "Verkaufen Sie bereits in diesem Geschäft?",
    signInHint:
      "Melden Sie sich mit der E-Mail-Adresse an, die Sie im Geschäft verwenden, um Ihre Artikel zu sehen.",
    newSeller: "Verkäufer in diesem Geschäft werden",
    contactStore:
      "Kontaktieren Sie das Geschäft, um sich als Verkäufer zu registrieren und die Abgabe zu besprechen. Es gelten die Bedingungen des Geschäfts.",
  },
  es: {
    selectedStore: "Tienda seleccionada",
    chooseAnother: "Elegir otra tienda",
    handInInfo: "Entrega e información de la tienda",
    photosOff:
      "Esta tienda no acepta propuestas de artículos por vía digital. Contacta con la tienda antes de llevar tus artículos.",
    existingSeller: "¿Ya vendes en esta tienda?",
    signInHint:
      "Inicia sesión con el correo electrónico que usas en la tienda para ver tus artículos.",
    newSeller: "Vende en esta tienda",
    contactStore:
      "Contacta con la tienda para registrarte como vendedor y saber cómo entregar los artículos. Se aplican las condiciones de la tienda.",
  },
  it: {
    selectedStore: "Negozio selezionato",
    chooseAnother: "Scegli un altro negozio",
    handInInfo: "Consegna e informazioni sul negozio",
    photosOff:
      "Il negozio non accetta proposte di articoli online. Contatta il negozio prima della consegna.",
    existingSeller: "Vendi già in questo negozio?",
    signInHint:
      "Accedi con l'indirizzo e-mail che usi nel negozio per vedere i tuoi articoli.",
    newSeller: "Diventa venditore nel negozio",
    contactStore:
      "Contatta il negozio per registrarti come venditore e sapere come consegnare gli articoli. Si applicano le condizioni del negozio.",
  },
};
