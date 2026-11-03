import * as Forge from 'node-forge'
const forge:typeof Forge=(Forge as any).default||Forge
import { strToU8, zipSync } from 'fflate'
import { customer } from './community'
import { clean, reply, token, limit } from './security'
import { walletImages } from './walletImages'
export async function walletTables(env:any){await env.DB.prepare("CREATE TABLE IF NOT EXISTS fidelity_members (id TEXT PRIMARY KEY,customer_id TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'ACTIVE',terms TEXT NOT NULL,joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run()}
const binary=(bytes:Uint8Array)=>Array.from(bytes).map(b=>String.fromCharCode(b)).join('')
const bytes=(value:string)=>Uint8Array.from(value,c=>c.charCodeAt(0))
const b64=(value:string)=>btoa(value).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')
export function applePass(member:any,person:any,env:any){
 const cert=forge.pki.certificateFromPem(env.APPLE_PASS_CERT_PEM),wwdr=forge.pki.certificateFromPem(env.APPLE_WWDR_CERT_PEM),key=forge.pki.privateKeyFromPem(env.APPLE_PASS_KEY_PEM)
 if(cert.validity.notAfter.getTime()<Date.now()||cert.validity.notBefore.getTime()>Date.now())throw new Error('Certificato Apple scaduto o non valido')
 const uid=cert.subject.attributes.find(a=>a.type==='0.9.2342.19200300.100.1.1')?.value,team=cert.subject.getField('OU')?.value
 if(uid!==env.APPLE_PASS_TYPE_ID||team!==env.APPLE_TEAM_ID)throw new Error('Pass Type ID o Team ID non corrispondente al certificato')
 const publicKey=cert.publicKey as Forge.pki.rsa.PublicKey;if(publicKey.n.compareTo((key as Forge.pki.rsa.PrivateKey).n)!==0)throw new Error('Chiave Apple non corrispondente al certificato')
 const pass={formatVersion:1,passTypeIdentifier:env.APPLE_PASS_TYPE_ID,serialNumber:member.id,teamIdentifier:env.APPLE_TEAM_ID,organizationName:'DeLù Clothes Shop',description:'DeLù Fidelity Card',logoText:'DeLù Fidelity',foregroundColor:'rgb(25,21,25)',backgroundColor:'rgb(239,189,208)',labelColor:'rgb(90,50,70)',storeCard:{primaryFields:[{key:'name',label:'SOCIA DELÙ',value:person.name}],secondaryFields:[{key:'member',label:'NUMERO TESSERA',value:member.id}],backFields:[{key:'terms',label:'Regolamento',value:member.terms},{key:'website',label:'La tua tessera',value:env.SITE_URL+'/fidelity'}]},barcodes:[{format:'PKBarcodeFormatQR',message:member.id,messageEncoding:'iso-8859-1',altText:member.id}]}
 const files:Record<string,Uint8Array>={'pass.json':strToU8(JSON.stringify(pass))}
 for(const [name,value]of Object.entries(walletImages))files[name]=bytes(atob(value))
 const manifest:Record<string,string>={};for(const [name,data]of Object.entries(files))manifest[name]=forge.md.sha1.create().update(binary(data)).digest().toHex()
 files['manifest.json']=strToU8(JSON.stringify(manifest));const p7=forge.pkcs7.createSignedData();p7.content=forge.util.createBuffer(binary(files['manifest.json']));p7.addCertificate(cert);p7.addCertificate(wwdr)
 p7.addSigner({key,certificate:cert,digestAlgorithm:forge.pki.oids.sha256,authenticatedAttributes:[{type:forge.pki.oids.contentType,value:forge.pki.oids.data},{type:forge.pki.oids.messageDigest},{type:forge.pki.oids.signingTime,value:new Date() as any}]});p7.sign({detached:true})
 files.signature=bytes(forge.asn1.toDer(p7.toAsn1()).getBytes());return zipSync(files,{level:0})
}
export function samsungCard(member:any,person:any,env:any){
 const now=Date.now(),data={card:{type:'loyalty',subType:'others',data:[{refId:member.id,createdAt:Date.parse(member.joined_at.replace(' ','T')+'Z'),updatedAt:now,language:'it',attributes:{title:'DeLù Fidelity',providerName:'DeLù Clothes Shop',subtitle1:person.name.slice(0,32),appLinkLogo:env.SITE_URL+'/wallet-logo.png',appLinkName:'DeLù Fidelity',appLinkData:env.SITE_URL+'/fidelity',logoImage:env.SITE_URL+'/wallet-logo.png',bgColor:'#EFBDD0','barcode.value':member.id,'barcode.serialType':'QRCODE','barcode.ptFormat':'QRCODESERIAL','barcode.ptSubFormat':'QR_CODE',noticeDesc:'Tessera personale. Verifica validità presso il negozio.',csInfo:JSON.stringify({website:env.SITE_URL})}}]}}
 const publicKey=forge.pki.publicKeyFromPem(env.SAMSUNG_PUBLIC_KEY_PEM),key=forge.pki.privateKeyFromPem(env.SAMSUNG_PARTNER_KEY_PEM),cek=binary(crypto.getRandomValues(new Uint8Array(16))),iv=binary(crypto.getRandomValues(new Uint8Array(12))),header=b64(JSON.stringify({alg:'RSA1_5',enc:'A128GCM'}))
 const cipher=forge.cipher.createCipher('AES-GCM',cek);cipher.start({iv,additionalData:header,tagLength:128});cipher.update(forge.util.createBuffer(forge.util.encodeUtf8(JSON.stringify(data))));if(!cipher.finish())throw new Error('Impossibile cifrare la tessera')
 const jwe=[header,b64(publicKey.encrypt(cek,'RSAES-PKCS1-V1_5')),b64(iv),b64(cipher.output.getBytes()),b64(cipher.mode.tag.getBytes())].join('.')
 const jwsHeader=b64(JSON.stringify({alg:'RS256',cty:'CARD',ver:3,certificateId:env.SAMSUNG_CERTIFICATE_ID,partnerId:env.SAMSUNG_PARTNER_ID,utc:now})),input=jwsHeader+'.'+b64(jwe),md=forge.md.sha256.create();md.update(input)
 const cdata=input+'.'+b64(key.sign(md));return 'https://a.swallet.link/atw/v3/'+encodeURIComponent(env.SAMSUNG_CARD_ID)+'#Clip?cdata='+cdata
}
export async function walletRoute(r:Request,env:any,path:string,admin:boolean):Promise<Response|null>{
 if(!path.startsWith('fidelity')&&!path.startsWith('admin/fidelity'))return null
 await walletTables(env);const method=r.method,b:any=method==='POST'?await r.json().catch(()=>({})):{}
 const apple=!!(env.APPLE_PASS_CERT_PEM&&env.APPLE_PASS_KEY_PEM&&env.APPLE_WWDR_CERT_PEM&&env.APPLE_PASS_TYPE_ID&&env.APPLE_TEAM_ID),samsung=!!(env.SAMSUNG_PARTNER_KEY_PEM&&env.SAMSUNG_PUBLIC_KEY_PEM&&env.SAMSUNG_CERTIFICATE_ID&&env.SAMSUNG_PARTNER_ID&&env.SAMSUNG_CARD_ID)
 if(path==='fidelity/config')return reply({terms:env.FIDELITY_TERMS||'',apple,samsung})
 if(path==='admin/fidelity'&&admin){const {results}=await env.DB.prepare('SELECT f.*,c.name,c.email FROM fidelity_members f JOIN customers c ON c.id=f.customer_id ORDER BY joined_at DESC LIMIT 250').all();return reply(results)}
 if(path==='admin/fidelity/status'&&admin&&method==='POST'){if(!['ACTIVE','REVOKED'].includes(b.status))return reply({error:'Stato non valido'},400);await env.DB.prepare('UPDATE fidelity_members SET status=? WHERE id=?').bind(b.status,clean(b.id,100)).run();return reply({ok:true})}
 if(path.startsWith('admin/'))return reply({error:'Non autorizzato'},401)
 const c=await customer(r,env);if(!c)return reply({error:'Registrati e conferma la email per aderire alla Fidelity.'},401)
 if(path==='fidelity/join'&&method==='POST'){if(!env.FIDELITY_TERMS||b.accepted!==true)return reply({error:'Leggi e accetta il regolamento Fidelity.'},400);await env.DB.prepare('INSERT OR IGNORE INTO fidelity_members(id,customer_id,terms) VALUES(?,?,?)').bind('DL-'+token().slice(0,24).toUpperCase(),c.id,env.FIDELITY_TERMS).run();return reply({ok:true})}
 const member=await env.DB.prepare('SELECT * FROM fidelity_members WHERE customer_id=?').bind(c.id).first()
 if(path==='fidelity/me')return reply({member})
 if(!member||member.status!=='ACTIVE')return reply({error:'Tessera non attiva'},403)
 if(path==='fidelity/apple'&&method==='GET'){if(!await limit(env,'wallet:'+c.id,10,60))return reply({error:'Attendi prima di scaricare nuovamente la tessera'},429);if(!apple)return reply({error:'Apple Wallet in attivazione: mancano i certificati del negozio.'},503);try{return new Response(applePass(member,c,env),{headers:{'content-type':'application/vnd.apple.pkpass','content-disposition':'attachment; filename="delu-fidelity.pkpass"','cache-control':'no-store'}})}catch{return reply({error:'Certificati Apple non validi. Contatta il negozio.'},503)}}
 if(path==='fidelity/samsung'&&method==='POST'){if(!await limit(env,'wallet:'+c.id,10,60))return reply({error:'Attendi prima di riprovare'},429);if(!samsung)return reply({error:'Samsung Wallet in attivazione: completare onboarding e certificati.'},503);try{return reply({url:samsungCard(member,c,env)})}catch{return reply({error:'Chiavi Samsung non valide. Contatta il negozio.'},503)}}
 return reply({error:'Non trovato'},404)
}
