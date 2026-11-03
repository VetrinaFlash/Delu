# DeLù — richieste, pagamento dopo verifica, Fidelity e spedizioni

## Database automatico

Le API eseguono le migrazioni idempotenti in functions/_lib/database.ts prima di accedere al database: la prima richiesta dopo il deploy inizializza database/schema.sql e registra la versione applicata. Il caricamento della home chiama il catalogo e avvia quindi l'inizializzazione. Non sono necessari comandi SQL manuali.

Occorre comunque creare un database D1 in Cloudflare e collegarlo al progetto Pages con binding **DB**: il codice non può creare una risorsa nell'account Cloudflare senza credenziali di gestione. Le migrazioni non cancellano i dati e non sostituiscono i prezzi. Popolano tabelle e impostazioni iniziali; non inventano prodotti, clienti o ordini. Non inserire dati demo nel negozio reale.

Per modificare lo schema in futuro, rigenerare anche database.ts dalla versione aggiornata di schema.sql e aggiornare schemaVersion. Non modificare solo il file SQL. Variazioni distruttive richiedono una migrazione esplicita e backup.

## Flusso dell'ordine

1. Il cliente invia capi, varianti, quantità, indirizzo, email e telefono internazionale con prefisso, per esempio +39.
2. L'ordine entra in **Da confermare**. Nessuna chiamata Nexi, nessun addebito, nessuna prenotazione o riduzione dello stock locale.
3. Lo staff apre l'ordine e verifica i magazzini fisici. Può sostituire articoli/varianti, cambiare quantità o prezzi, impostare spedizione e sconto. Deve salvare le variazioni.
4. “Rifiuta richiesta” informa il cliente via email se Resend è configurato. “Conferma e genera link” blocca il totale salvato e genera un link DeLù valido sette giorni.
5. “Apri WhatsApp” apre wa.me con telefono, riepilogo, totale e link già compilati. L'operatore conferma l'invio. Non viene dichiarato un invio automatico WhatsApp Business API.
6. Il cliente apre il link, verifica le variazioni e accetta articoli e importo finale. Il sistema crea in quel momento la pagina Nexi HPP. Il link DeLù non è un link Nexi pre-generato che potrebbe già essere scaduto quando viene inviato.
7. Solo una notifica Nexi autenticata con importo e valuta corretti, o la verifica server dell'operazione, segna il pagamento eseguito. Lo staff riceve aggiornamento dashboard/email. Il cliente riceve la conferma.
8. L'ordine passa a **Pagato - da preparare** e si abilita la preparazione dell'etichetta.

La quantità del catalogo non rappresenta una disponibilità affidabile: non blocca la richiesta. Il sistema limita ciascuna riga a 20 pezzi e il catalogo deve contenere varianti valide.

Un importo con link già emesso non si modifica: prima di nuove richieste o addebiti occorre riconciliare l'eventuale pagamento con Nexi e informare il cliente. In caso di errore o timeout durante la creazione HPP lo stato è CHECK_REQUIRED: non viene generata una seconda sessione alla cieca. Per i tentativi falliti/scaduti lo staff deve verificare il terminale prima di ripartire con una nuova richiesta. Non inviare un secondo link mentre una sessione potrebbe essere pagabile.

La disponibilità fra magazzini resta una verifica umana: il software non si presenta come sincronizzazione con gestionali esterni. I nuovi ordini pagati non decrementano numeri di stock non attendibili.

## Fidelity Apple Wallet

L'adesione avviene su /fidelity, con account verificato e accettazione del regolamento, separata dal marketing. La tessera contiene un identificativo casuale e un QR; non contiene token di accesso. Lo staff ne verifica lo stato in “Clienti e resi → Fidelity Card”.

Variabili Cloudflare:

| Nome | Tipo |
|---|---|
| FIDELITY_TERMS | Testo con regolamento effettivo del programma |
| APPLE_PASS_TYPE_ID | Testo, es. pass.it.delu.fidelity |
| APPLE_TEAM_ID | Testo, Team ID Apple Developer |
| APPLE_PASS_CERT_PEM | Secret, certificato Pass Type ID in PEM |
| APPLE_PASS_KEY_PEM | Secret, relativa chiave RSA privata in PEM non cifrata |
| APPLE_WWDR_CERT_PEM | Secret, certificato intermedio Apple WWDR corretto |

Apple Developer → Certificates, Identifiers & Profiles: registra Pass Type ID e genera il relativo certificato tramite CSR. Converti .cer in PEM con openssl se necessario. Non caricare chiavi in GitHub o in chat. Il codice controlla scadenza e corrispondenza di Pass Type ID, Team ID e chiave prima di creare il file .pkpass. Il pacchetto comprende manifest SHA-1 e firma CMS detached SHA-256.

Il programma implementa una tessera di iscrizione, non un portafoglio monetario o una raccolta punti inventata. Definire benefici e regolamento prima di abilitarlo. Non sono implementati NFC, accredito automatico punti o aggiornamenti push delle tessere: la sospensione vale nel registro del negozio e va verificata lì, non dall'immagine salvata sul telefono.

## Fidelity Samsung Wallet

Occorre completare il Samsung Wallet Partners onboarding, ottenere l'abilitazione del servizio nel mercato interessato e registrare un template **loyalty / others**.

| Nome | Tipo |
|---|---|
| SAMSUNG_PARTNER_ID | Testo |
| SAMSUNG_CARD_ID | Testo del template abilitato |
| SAMSUNG_CERTIFICATE_ID | Testo dell'identificativo del certificato rilasciato |
| SAMSUNG_PARTNER_KEY_PEM | Secret, chiave RSA privata partner |
| SAMSUNG_PUBLIC_KEY_PEM | Secret, chiave pubblica Samsung associata all'ambiente |

Il pulsante genera al clic il Data Transmit Link ufficiale. Il contenuto è cifrato in JWE (RSA1_5/A128GCM secondo il profilo Samsung documentato) e firmato con JWS RS256; il token include utc, certificateId e partnerId. Non viene riutilizzata una firma statica fra clienti.

Prima del lancio, Samsung deve accettare template, certificati, dominio e servizio. Verificare sul dispositivo reale la compatibilità del Paese/account Samsung e i requisiti di branding dei pulsanti. I test crittografici con certificati di prova non sostituiscono l'onboarding né l'aggiunta su Apple/Samsung reali.

## Etichette Sendcloud

La preparazione si abilita soltanto dopo pagamento verificato. Si crea un'etichetta corriere reale attraverso Sendcloud v2; lo staff conferma peso effettivo, via senza civico, civico e ID servizio di spedizione. L'operazione può avere costi del corriere.

Configurare:

| Nome | Tipo |
|---|---|
| SENDCLOUD_PUBLIC_KEY | Secret |
| SENDCLOUD_SECRET_KEY | Secret |
| SENDCLOUD_SENDER_ID | Testo, ID indirizzo mittente configurato in Sendcloud |

Connettere il corriere/contratto in Sendcloud e recuperare l'ID del servizio disponibile. Non inventare il servizio o il peso. L'integrazione automatica è limitata alle destinazioni UE previste; per extra UE servono dati doganali e la spedizione va gestita nel pannello del corriere finché questi dati non sono integrati.

La richiesta di etichetta è bloccata dopo il primo avvio per evitare doppie spese. Se Sendcloud risponde con etichetta ancora in elaborazione oppure l'esito è incerto, verificare il pannello Sendcloud: nessun secondo acquisto automatico. Tracking e parcel ID sono conservati quando confermati.

## Configurazioni già necessarie

Restano necessari SITE_URL HTTPS definitivo, binding DB e PRODUCT_IMAGES, Nexi, credenziali admin, Resend con dominio verificato e informative del negozio. Configurare WhatsApp sul telefono/computer dello staff; wa.me non richiede chiavi API. Per invio automatico senza intervento staff sarebbe invece necessaria un'integrazione Meta WhatsApp Business con numero, template e permessi approvati: non è il meccanismo implementato.

## Collaudo richiesto

- Invio di richiesta con stock catalogo zero: nessuna chiamata Nexi e nessun addebito.
- Contatti obbligatori, variante inesistente, modifiche concorrenti e doppia approvazione.
- Ricalcolo importo, link recuperabile dalla dashboard e riepilogo WhatsApp.
- Apertura link, conferma variazioni, notifica Nexi con token/importo/valuta errati.
- Successo, rifiuto, annullamento, timeout ed esito incerto. Una notifica di fallimento tardiva non deve retrocedere un ordine pagato.
- Etichette solo per ordini pagati e blocco delle richieste duplicate.
- Iscrizione Fidelity senza consenso marketing, duplicata, tessera sospesa e accesso di altro cliente.
- Firma .pkpass verificata con OpenSSL e hash del manifest; firma e decifratura Samsung verificate localmente.
- Test finali su device Apple/Samsung con certificati reali, terminale Nexi e account Sendcloud del negozio. I test automatici non effettuano addebiti, invii WhatsApp o acquisti etichette reali.

Fonti:
- https://developer.apple.com/help/account/capabilities/create-wallet-identifiers-and-certificates/
- https://developer.samsung.com/wallet/welcome/introduction.html
- https://developer.samsung.com/wallet/addtosamsungwallet/walletcards/loyalty.html
- https://developer.samsung.com/wallet/securityauthentication/carddatatoken.html
- https://developer.nexi.it/it/modalita-di-integrazione/hosted-payment-page
- https://sendcloud.dev/docs/shipping/create-a-parcel
