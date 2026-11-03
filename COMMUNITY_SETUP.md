# DeLù: attivazione account, email, ordini e resi

## Stato e confini

L'acquisto come ospite resta disponibile. Registrazione email e Google si attivano solo dopo la configurazione del servizio e dell'informativa privacy. I pagamenti richiedono anche condizioni di vendita e indirizzo resi. Non usare testi segnaposto in produzione.

La dashboard aperta controlla gli ordini ogni 8 secondi e al ritorno in primo piano. Il pulsante “Attiva avvisi browser” richiede il permesso al dispositivo. Con web app chiusa gli avvisi sono **email**, non Web Push: il progetto non dichiara notifiche push in background. L'invio è innescato dalla conferma server del pagamento. Nessun numero carta o indirizzo cliente viene mostrato nelle notifiche browser.

Le sessioni admin durano 30 giorni di inattività e al massimo 90 giorni. L'uso della dashboard rinnova cookie e scadenza di inattività. Una settimana prima del limite assoluto viene accodata un'email di promemoria quando la dashboard è utilizzata. Dopo la scadenza la dashboard mostra il login e, se autorizzato dal dispositivo, un avviso. Non è garantito un avviso dispositivo con app chiusa. Logout revoca la sessione; “Revoca tutti gli accessi admin” revoca tutti i dispositivi. Cambiare password admin o AUTH_SECRET invalida gli accessi esistenti.

## Cloudflare → Pages → Settings → Variables and Secrets → Production

Mantieni DB, PRODUCT_IMAGES, ADMIN_EMAIL, ADMIN_PASSWORD_SHA256, AUTH_SECRET e variabili Nexi. Aggiungi:

| Nome | Tipo | Valore |
|---|---|---|
| RESEND_API_KEY | Secret | Chiave Resend con permesso di invio |
| EMAIL_FROM | Testo | DeLù <ordini@DOMINIO-VERIFICATO> |
| GOOGLE_CLIENT_ID | Testo | Client ID OAuth di tipo Web |
| GOOGLE_CLIENT_SECRET | Secret | Client secret Google |
| SITE_URL | Testo | Origine HTTPS definitiva senza slash finale |
| RETURNS_ADDRESS | Testo | Indirizzo completo effettivamente autorizzato a ricevere i resi |
| PRIVACY_NOTICE | Testo | Informativa approvata, con titolare, contatti, finalità, basi giuridiche, fornitori, trasferimenti, conservazione e diritti |
| TERMS_NOTICE | Testo | Condizioni di vendita approvate, con ragione sociale, P.IVA, contatti, consegne, pagamenti, garanzia, recesso, costi e modulo tipo |

Le nuove tabelle sono create idempotentemente dalle API. Lo schema completo per installazioni nuove è database/schema.sql. Non viene cancellato il catalogo esistente.

## Resend

1. Aggiungi il dominio del negozio a Resend Domains.
2. Inserisci in Cloudflare DNS esattamente i record SPF/DKIM indicati da Resend e completa la verifica. Configura DMARC per il dominio.
3. Crea una chiave di invio e inseriscila solo in RESEND_API_KEY.
4. Configura EMAIL_FROM con un mittente del dominio verificato. Disabilita open tracking e click tracking: non sono utilizzati dal progetto.
5. Redeploy e prova una registrazione reale, conferma, reset password, notifica ordine e ricevuta reso su caselle controllate.

L'outbox conserva le email e i tentativi; l'interfaccia admin mostra il numero in attesa. Le API riprovano in background ad ogni richiesta (massimo 15 email per passaggio, massimo 12 tentativi). Non c'è un cron separato: se il sito non riceve traffico, aprire la dashboard avvia i nuovi tentativi. Non viene dichiarata una consegna al destinatario solo perché Resend ha accettato il messaggio. Per evitare duplicati oltre la finestra di idempotenza, invii non riusciti dopo 23 ore restano da esaminare; non vengono ritentati automaticamente. Configurare monitoraggio e un processo di recupero prima di grandi campagne.

## Google

1. Google Cloud Console → Google Auth Platform: configura applicazione, dominio, privacy e schermata di consenso.
2. Crea un OAuth Client ID di tipo **Web application**.
3. Aggiungi come redirect autorizzato:
   https://DOMINIO-DEFINITIVO/api/customer/google/callback
4. Copia ID e secret nei parametri Cloudflare e pubblica la schermata di consenso secondo le indicazioni Google.
5. Prova accesso riuscito, annullato e email già registrata. Per collegare Google a un account email esistente, accedi prima con password. Il collegamento non viene effettuato automaticamente in base alla sola email.

Solo il backend scambia il codice; state e PKCE sono verificati. Nessun token Google viene salvato nel browser o utilizzato come sessione DeLù.

## Consensi e sconti

Il consenso marketing è facoltativo e non preselezionato. Vengono memorizzati valore e data di modifica; i messaggi sono inviati solo ad account verificati con consenso corrente, controllato nuovamente all'invio. La disiscrizione non richiede login: aprire il link e confermare. Resend non deve aggiungere tracking. L'admin invia uno sconto al cliente selezionato; non vengono importate liste o inviate campagne senza una scelta esplicita.

Ogni codice è personale, legato all'email, riutilizzabile per 30 giorni, 1–50%, non cumulabile con altri codici. Lo sconto si applica ai prodotti; la soglia di spedizione gratuita usa il subtotale prima dello sconto. Il checkout mostra il totale dopo convalida e il server ricalcola prezzi, disponibilità e sconto.

## Resi

La comunicazione di recesso va inviata entro 14 giorni dal ricevimento (ultimo bene in caso di consegna separata dell'unico ordine), e la restituzione entro i successivi 14 giorni dalla comunicazione. Il cliente sostiene il costo diretto del reso per ripensamento se informato prima del contratto; difetti e garanzia sono gestiti separatamente a carico del venditore.

Il rimborso dell'intero ordine comprende il costo di consegna standard, non supplementi per servizi più costosi. Termine 14 giorni dalla comunicazione, con possibilità di trattenere fino al ricevimento dei beni o prova della rispedizione. Non imporre credito negozio in luogo del rimborso dovuto.

Il modulo è facoltativo: il negozio deve accettare anche una dichiarazione esplicita tramite i propri recapiti. Non vengono respinte automaticamente richieste sulla base della data ordine o del campo consegna; termini prolungati per omessa informativa e diritti di garanzia richiedono valutazione dello staff. Registra la data effettiva di consegna, non quella di spedizione.

Il cambio di stato “Rimborsato” è solo amministrativo: eseguire il rimborso nel back office Nexi e riconciliarlo prima di registrarlo. Non sono automatizzate etichette corriere o restituzioni di denaro.

Fonti ufficiali da verificare con il professionista che approva i testi:
- https://www.mimit.gov.it/index.php/it/assistenza/domande-frequenti/diritto-di-recesso-domande-frequenti-faq
- https://www.garanteprivacy.it/it/home/i-miei-diritti/diritti
- https://developers.google.com/identity/openid-connect/openid-connect
- https://resend.com/docs/dashboard/emails/idempotency-keys

## Collaudo prima dell'attivazione

Esegui npm run test:security, npm run build, type-check Functions e test browser desktop/mobile. I test automatici usano SQLite reale e risposte simulate di Google/Resend/Nexi. **Non sostituiscono** il collaudo con credenziali, DNS, database e terminale reali.

Verifica registrazione e email già esistente, token riutilizzato/scaduto, recupero password con revoca delle sessioni, isolamento clienti/admin, consenso/disiscrizione, codice scaduto o email differente, reso ospite con email errata, invio duplicato, ordine pagato e aggiornamento dashboard. I test non generano pagamenti né inviano email reali.

Prima della vendita sono necessari identità legale e P.IVA del venditore, email assistenza, indirizzo resi effettivo, testi privacy/condizioni approvati e scelte documentate di conservazione/cancellazione. Il software da solo non certifica la conformità del negozio.
