# DeLù — accesso e attivazione servizi

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

I certificati dei due fornitori non sono intercambiabili. Il progetto emette carte di appartenenza con QR; punti, cashback, pagamenti NFC e aggiornamenti push delle carte richiederebbero funzioni ulteriori. Il collaudo crittografico automatico non sostituisce la prova con certificati di produzione su iPhone e Samsung compatibili.

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
