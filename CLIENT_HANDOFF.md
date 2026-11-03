# DeLù — accesso e attivazione servizi

## Checklist Cloudflare Production

Apri **Workers & Pages → delu → Settings** e seleziona **Production**. Inserisci i collegamenti a database e immagini in **Bindings**. Aggiungi le altre voci in **Variables and Secrets**. Dopo il salvataggio avvia un nuovo deploy e verifica che sia quello di produzione.

| Funzione | Nome | Tipo e valore |
|---|---|---|
| Database | `DB` | Binding D1 verso il database già usato dal negozio |
| Immagini prodotto | `PRODUCT_IMAGES` | Binding R2 verso il bucket immagini, necessario per gli upload |
| Dominio | `SITE_URL` | Text. `https://delu-49u.pages.dev` oppure il dominio definitivo in HTTPS, senza slash finale |
| Accesso admin | `ADMIN_EMAIL`, `ADMIN_USERNAME` | Text. Email reale del responsabile e, se usato, nome utente |
| Accesso admin | `ADMIN_PASSWORD_SHA256`, `AUTH_SECRET` | Secret. Hash SHA-256 della password e chiave di sessione. Mantieni i valori già in uso |
| Checkout | `PRIVACY_NOTICE` | Text. Contenuto di [PRIVACY_NOTICE.txt](PRIVACY_NOTICE.txt) |
| Conferma ordini | `TERMS_NOTICE`, `RETURNS_ADDRESS` | Text. Condizioni di vendita approvate e indirizzo effettivo per i resi |
| Email transazionali | `RESEND_API_KEY`, `EMAIL_FROM` | Secret per la chiave Resend. Text per il mittente su dominio verificato, ad esempio `DeLù <info@deluclothesshop.it>` se autorizzato in Resend |
| Nexi XPay | `NEXI_XPAY_API_KEY`, `NEXI_XPAY_BASE_URL` | Secret per la chiave. Text per la base URL corrispondente alla chiave |
| Push admin | `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_SUBJECT` | Text, Secret, Text. Procedura PowerShell qui sotto |
| Fidelity | `FIDELITY_TERMS` | Text. Regolamento effettivo della carta |
| Etichette Sendcloud | `SENDCLOUD_PUBLIC_KEY`, `SENDCLOUD_SECRET_KEY`, `SENDCLOUD_SENDER_ID` | Secret per le due chiavi. Text per l’ID del mittente |
| Google, Facebook, GitHub | Coppia `*_CLIENT_ID` e `*_CLIENT_SECRET` per ogni provider | Text e Secret. Callback e prerequisiti in [COMMUNITY_SETUP.md](COMMUNITY_SETUP.md) |
| Cliente dimostrativo | `DEMO_CUSTOMER_PASSWORD_HASH` | Secret, facoltativo. Mantieni il valore già impostato se stai ancora provando il demo |
| Apple Wallet e Samsung Wallet | Credenziali, identificativi e certificati del provider | Vedi le sezioni Wallet qui sotto |

Per Nexi usa `https://xpaysandbox.nexigroup.com/api/phoenix-0.0/psp` con chiave sandbox oppure `https://xpay.nexigroup.com/api/phoenix-0.0/psp` con chiave produzione. Il server aggiunge `/api/v1`. La callback è `/api/payments/nexi/notification` sul dominio configurato. Prima verifica in sandbox l’intero percorso, dalla richiesta al pagamento confermato nel pannello.

WhatsApp usa i collegamenti preparati dal pannello. Apri il messaggio sul dispositivo dello staff e conferma l’invio da WhatsApp.

Riferimenti: [Bindings Cloudflare Pages](https://developers.cloudflare.com/pages/functions/bindings/), [specifiche Nexi XPay](https://developer.nexi.it/en/api/specifiche-di-utilizzo-del-servizio).

## Generare le chiavi push su Windows

Apri PowerShell o il terminale di VS Code nella cartella del repository. Se hai già clonato il progetto, apri quella cartella e aggiorna `main` con `git pull --ff-only`. Se ti manca il repository, esegui:

```powershell
git clone https://github.com/VetrinaFlash/Delu.git
Set-Location .\Delu
```

Verifica Node e avvia lo script dalla radice del progetto:

```powershell
node --version
Test-Path .\scripts\admin-push-keys.mjs
node .\scripts\admin-push-keys.mjs
```

Se PowerShell non trova `node`, installa Node.js LTS e riapri il terminale. `Test-Path` deve restituire `True`. Lo script usa Node direttamente e non richiede `npm install`. Copia ogni valore dopo il primo segno `=` nella voce Cloudflare con lo stesso nome:

1. `WEB_PUSH_PUBLIC_KEY` come **Text**.
2. `WEB_PUSH_PRIVATE_KEY` come **Secret**. Copiala direttamente in Cloudflare.
3. `WEB_PUSH_SUBJECT` come **Text**, valore `mailto:info@deluclothesshop.it`.

Genera una sola coppia per ambiente e conserva i valori in modo sicuro. Se hai già una coppia attiva, riusala. La rotazione richiede una nuova iscrizione push sui dispositivi.

Dopo il deploy apri `/admin` su Android o Windows con un browser compatibile. Su iPhone con iOS 16.4 o successivo aggiungi prima la web app alla schermata Home e aprila dall’icona. Accedi, premi **Attiva push** e poi **Invia push di prova**. Per l’avviso locale a dashboard aperta premi **Attiva suono dashboard**. Il suono delle push in background segue le impostazioni del dispositivo.

## Verifiche prima della consegna

1. Accedi all’admin da desktop e mobile, apri un ordine e verifica l’uscita.
2. Prova account, indirizzo salvato, carrello e richiesta di acquisto sul dominio pubblico.
3. Verifica una mail reale ricevuta. Esegui un pagamento sandbox fino all’esito visibile nel pannello.
4. Invia una push di prova dai dispositivi effettivamente usati in negozio.
5. Verifica apertura WhatsApp, attivazione Fidelity e, se configurati, i servizi Wallet e Sendcloud.

## Accesso del cliente

URL attuale: https://delu-49u.pages.dev/admin

Cloudflare → Workers & Pages → progetto DeLù → Settings → Variables and Secrets → ambiente Production:

| Nome | Valore |
|---|---|
| `ADMIN_USERNAME` | `admin` (oppure un nome scelto) |
| `ADMIN_EMAIL` | Email reale del responsabile, necessaria anche per le notifiche |
| `ADMIN_PASSWORD_SHA256` | SHA-256 della password consegnata privatamente |
| `AUTH_SECRET` | Segreto casuale di almeno 32 byte, conservato come Secret |
| `SITE_URL` | `https://delu-49u.pages.dev` senza slash finale |

Password, hash e segreti reali non sono inseriti nel repository. La generazione di una password non configura automaticamente Cloudflare: salvare i valori come Secret e avviare un nuovo deploy. È possibile accedere con username oppure email configurati. La variazione di queste impostazioni invalida le sessioni esistenti. Non usare account o password condivisi con ambienti demo.

Generare un nuovo segreto sessione: `openssl rand -hex 32`. Per cambiare password calcolarne il digest SHA-256, senza newline finale. Non inserire questi valori in variabili `VITE_*`, nel codice frontend o in chat di gruppo.

## Apple Wallet

Occorre un account Apple Developer abilitato, con ruolo Account Holder o Admin. Nel portale **Certificates, Identifiers & Profiles**:

1. **Identifiers → + → Pass Type IDs**. Registrare un identificatore, ad esempio `pass.it.delu.fidelity` (esempio, non già registrato).
2. Sul computer che custodirà la chiave privata generare una chiave e un CSR. Su macOS si può usare Accesso Portachiavi → Assistente certificato → Richiedi un certificato a un’autorità di certificazione.
3. **Certificates → + → Pass Type ID Certificate**. Selezionare il Pass Type ID e caricare il CSR; scaricare il certificato `.cer`.
4. Conservare la chiave privata corrispondente. Convertire il certificato in PEM se necessario: `openssl x509 -inform DER -in pass.cer -out pass.pem`.
5. Recuperare Team ID e certificato intermedio Apple WWDR appropriato dalla documentazione Apple.
6. Impostare i Secret `APPLE_PASS_TYPE_ID`, `APPLE_TEAM_ID`, `APPLE_PASS_CERT_PEM`, `APPLE_PASS_KEY_PEM`, `APPLE_WWDR_CERT_PEM`.

I PEM devono avere vere righe, intestazioni BEGIN/END comprese. Certificato, chiave, Team ID e Pass Type ID devono corrispondere. Impostare un promemoria prima della scadenza del certificato e sostituirlo per continuare a emettere carte.

Guida ufficiale: https://developer.apple.com/help/account/capabilities/create-wallet-identifiers-and-certificates/

## Samsung Wallet

La procedura è distinta da Apple e richiede onboarding del partner presso Samsung:

1. Aprire Samsung Wallet Partners Portal dalla guida ufficiale e accedere con un Samsung Account dell’azienda.
2. Registrare società e servizio, scegliere una carta fedeltà e il template, completare le verifiche richieste da Samsung.
3. Generare chiave privata RSA e CSR seguendo i vincoli della guida Samsung. Il Common Name del CSR deve coincidere con il dominio FQDN usato dall’integrazione: scegliere prima il dominio definitivo.
4. Registrare CSR e impostazioni di cifratura nel portale. Samsung emette gli artefatti di certificazione; conservare la chiave privata in sicurezza.
5. Recuperare Partner ID, Card ID, Certificate ID e certificato/chiave pubblica Samsung.
6. Impostare i Secret `SAMSUNG_PARTNER_ID`, `SAMSUNG_CARD_ID`, `SAMSUNG_CERTIFICATE_ID`, `SAMSUNG_PARTNER_KEY_PEM`, `SAMSUNG_PUBLIC_KEY_PEM`.
7. Completare test e approvazione/publishing della carta previsti dal portale prima di proporla ai clienti.

Guide ufficiali:
- https://developer.samsung.com/wallet/overview/onboardingguide.html
- https://developer.samsung.com/wallet/securityauthentication/keycertificatelifecycle.html

I certificati dei due fornitori non sono intercambiabili. Il portale consente di accreditare punti e riconoscere gli ordini pagati. Le carte Wallet emesse identificano la tessera tramite QR. Il saldo del portale non si sincronizza automaticamente con le carte Wallet già installate. Il collaudo crittografico automatico non sostituisce la prova con certificati di produzione su iPhone e Samsung compatibili.

## Altre impostazioni necessarie

- Binding D1 `DB` e R2 immagini già previsti: schema e catalogo iniziale vengono preparati automaticamente alla prima richiesta API. Il bootstrap non sovrascrive dati del negozio e non inventa ordini o clienti.
- `PRIVACY_NOTICE`, `TERMS_NOTICE`, `RETURNS_ADDRESS`, `FIDELITY_TERMS`: testi reali del titolare, condizioni vendita/resi e regolamento fidelity.
- Email: `RESEND_API_KEY`, `EMAIL_FROM` su dominio verificato; registrare i record DNS richiesti da Resend. Senza configurazione non considerare testata la consegna delle email di verifica, ordine e recupero password.
- Pagamenti: credenziali Nexi dell’ambiente scelto e relativo collaudo. L’ordine parte come richiesta; il pagamento si apre dopo conferma admin e accettazione del cliente. Vedere `ORDER_REVIEW_WALLET_SETUP.md`.
- Etichette: credenziali Sendcloud e mittente configurato per acquistare etichette. Le prove automatiche simulano il corriere e non acquistano spedizioni.
- Accesso Google facoltativo: Client ID/Secret e redirect autorizzato sul dominio effettivamente usato, come indicato in `COMMUNITY_SETUP.md`.
- WhatsApp attuale: il pulsante prepara il messaggio, che il personale invia da WhatsApp. L’invio automatico richiederebbe un’integrazione WhatsApp Business separata.
- Quando arriva il dominio pubblico: aggiungerlo in Cloudflare, aggiornare `SITE_URL`, redirect OAuth e impostazioni/callback Nexi e Samsung interessate, quindi riprovare registrazione, email, ordine, pagamento e wallet. Usare lo stesso dominio in tutto il percorso di pagamento.

## Catalogo dai documenti forniti

Abiti: colore, taglia, lunghezza, materiale, prezzo, occasione. Modello è una caratteristica, non un filtro.

Pantaloni/jeans: colore, taglia, modello, lunghezza, materiale, prezzo. Vestibilità, vita e taglio della gamba restano caratteristiche.

Cappotti/pellicce e bigiotteria hanno campi e filtri pertinenti. Le selezioni all’interno di un filtro si combinano in OR; filtri diversi si combinano in AND. I conteggi dipendono dai prodotti realmente pubblicati; i campi vuoti non compaiono nella scheda. Non attribuire materiali, percentuali o lavorazioni a mano non verificati.

Valori standard e intestazioni del catalogo sono disponibili in italiano, inglese, tedesco, ucraino e russo; per valori personalizzati l’admin può inserire traduzioni. Il resto del sito mantiene anche francese e spagnolo; alcune comunicazioni di servizio continuano a utilizzare i testi già esistenti e i testi legali configurati dal titolare.
