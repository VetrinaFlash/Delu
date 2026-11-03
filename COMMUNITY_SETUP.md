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

La funzione online include il collegamento “Recedere dal contratto qui” e il pulsante “Conferma recesso” (art. 54-bis). Il nome è confermato prima dell’invio, la ricevuta include contenuto e data/ora.

Fonti ufficiali da verificare con il professionista che approva i testi:
- https://www.gazzettaufficiale.it/atto/serie_generale/caricaArticoloDefault/originario?atto.codiceRedazionale=26G00002&atto.dataPubblicazioneGazzetta=2026-01-08&atto.tipoProvvedimento=DECRETO+LEGISLATIVO
- https://www.mimit.gov.it/index.php/it/assistenza/domande-frequenti/diritto-di-recesso-domande-frequenti-faq
- https://www.garanteprivacy.it/it/home/i-miei-diritti/diritti
- https://developers.google.com/identity/openid-connect/openid-connect
- https://resend.com/docs/dashboard/emails/idempotency-keys

## Collaudo prima dell'attivazione

Esegui npm run test:security, npm run build, type-check Functions e test browser desktop/mobile. I test automatici usano SQLite reale e risposte simulate di Google/Resend/Nexi. **Non sostituiscono** il collaudo con credenziali, DNS, database e terminale reali.

Verifica registrazione e email già esistente, token riutilizzato/scaduto, recupero password con revoca delle sessioni, isolamento clienti/admin, consenso/disiscrizione, codice scaduto o email differente, reso ospite con email errata, invio duplicato, ordine pagato e aggiornamento dashboard. I test non generano pagamenti né inviano email reali.

Prima della vendita sono necessari identità legale e P.IVA del venditore, email assistenza, indirizzo resi effettivo, testi privacy/condizioni approvati e scelte documentate di conservazione/cancellazione. Il software da solo non certifica la conformità del negozio.

## Provider social e demo

Inserire l'informativa definitiva nel valore di produzione `PRIVACY_NOTICE`. Copiare integralmente il file `PRIVACY_NOTICE.txt` con i dati del titolare confermati. Verificare con il titolare che le prassi di conservazione e i fornitori attivi corrispondano al testo.

| Provider | Variabili di produzione | Callback con il dominio attuale |
| --- | --- | --- |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `https://delu-49u.pages.dev/api/customer/google/callback` |
| Facebook | `FACEBOOK_CLIENT_ID` (App ID), `FACEBOOK_CLIENT_SECRET` (App Secret), `FACEBOOK_GRAPH_VERSION` (versione Graph API dell'app, default v23.0) | `https://delu-49u.pages.dev/api/customer/facebook/callback` |
| GitHub | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | `https://delu-49u.pages.dev/api/customer/github/callback` |

Inserire i client secret come Secret. Facebook richiede l'app Meta con Facebook Login, redirect autorizzato, email disponibile, app abilitata per i clienti e Resend configurato. Il cliente conferma il link nello stesso browser usato per iniziare la registrazione. GitHub usa una OAuth App e richiede l'email primaria verificata. Un account già esistente si collega dal profilo autenticato. Dopo una variazione di dominio aggiornare le callback e `SITE_URL`.

Per il cliente demo impostare `DEMO_CUSTOMER_PASSWORD_HASH` come Secret di produzione e ridistribuire. Al primo accesso corretto con `cliente.demo@delu.example` il portale crea il cliente dimostrativo con email già confermata. Rimuovendo il Secret si disabilitano accesso e sessione demo. La casella è fittizia e non riceve email.

La migrazione aggiunge tessuti e caratteristiche dimostrative ai sei prodotti campione originali privi di dati. Prima della vendita sostituire le specifiche con quelle reali e rimuovere il tag `demo-specifications` dalla scheda del prodotto.

## Profilo acquisto e Fidelity

La registrazione email raccoglie contatti e indirizzo di spedizione. Gli account precedenti e social possono completare i dati nella pagina account. Il primo ordine effettuato con sessione cliente e la stessa email inizializza i recapiti ancora assenti. Le modifiche al checkout valgono per l'ordine corrente quando il profilo ha già un indirizzo.

La Fidelity mostra gli ordini con pagamento registrato, abbinati all'email del cliente. Lo staff accredita punti in Clienti e resi → Fidelity Card indicando una causale o il riferimento dello scontrino. L'accredito usa una chiave idempotente. Non è prevista una conversione automatica da euro a punti o la spesa di un saldo in denaro.

Per usare il testo aggiornato, copia PRIVACY_NOTICE.txt nella variabile PRIVACY_NOTICE dell'ambiente Production.

## Notifiche Web Push per il pannello admin

Esegui `node scripts/admin-push-keys.mjs` una volta. Copia i tre valori in Cloudflare Pages → DeLù → Settings → Variables and Secrets → Production e fai un nuovo deploy.

- `WEB_PUSH_PUBLIC_KEY` come Text.
- `WEB_PUSH_PRIVATE_KEY` come Secret.
- `WEB_PUSH_SUBJECT` come Text, nel formato `mailto:info@deluclothesshop.it`.

Mantieni la stessa coppia di chiavi fra i deploy. Con un nuovo dominio o una nuova coppia di chiavi ogni dispositivo deve riattivare le push. Non condividere la chiave privata e non salvarla nel repository.

Su iPhone con iOS 16.4 o successivo, apri il pannello in Safari, usa Condividi → Aggiungi alla schermata Home e apri DeLù Admin dall’icona. Su Android e Windows usa un browser compatibile con Web Push, anche tramite installazione della web app. Accedi, scegli Attiva push e consenti le notifiche. Invia push di prova sul dispositivo per controllare permesso, consegna e impostazioni audio.

Gli avvisi di ordine, pagamento ricevuto e pagamento non riuscito vengono emessi dal server. Il suono delle push in background dipende dalle impostazioni del sistema e del browser. Il pulsante Attiva suono dashboard riproduce e abilita un avviso locale per la pagina aperta. Uscendo dal pannello si disiscrive il dispositivo.
