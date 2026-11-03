import {useEffect,useRef,useState} from 'react'
import {Bell,Volume2} from 'lucide-react'
import {api} from './shared'

function supported(){
 return 'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window
}
function decodeKey(key:string){
 return Uint8Array.from(atob(key.replaceAll('-','+').replaceAll('_','/')),char=>char.charCodeAt(0))
}
function sameKey(subscription:PushSubscription,key:Uint8Array){
 const existing=subscription.options.applicationServerKey
 return existing&&new Uint8Array(existing).every((byte,i)=>byte===key[i])&&existing.byteLength===key.length
}
export async function disableAdminPush(){
 if(!supported())return
 const registration=await navigator.serviceWorker.getRegistration('/admin')
 const subscription=await registration?.pushManager.getSubscription()
 if(!subscription)return
 await subscription.unsubscribe()
 await api('/api/admin/push/unsubscribe',{method:'POST',body:JSON.stringify({endpoint:subscription.endpoint})})
}

export default function PushControls({eventCount}:{eventCount:number}){
 const [key,setKey]=useState(''),[registration,setRegistration]=useState<ServiceWorkerRegistration|null>(null)
 const [enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
 const [sound,setSound]=useState(false)
 const audio=useRef<AudioContext|null>(null)
 useEffect(()=>{
  let active=true
  if(supported())api<{publicKey:string|null}>('/api/admin/push/config').then(async ({publicKey})=>{
   if(!publicKey||!active)return
   setKey(publicKey)
   await navigator.serviceWorker.register('/admin-push-sw.js',{scope:'/admin'})
   const worker=await navigator.serviceWorker.ready
   const existing=await worker.pushManager.getSubscription()
   if(!active)return
   setRegistration(worker)
   setEnabled(!!existing&&!!sameKey(existing,decodeKey(publicKey))&&Notification.permission==='granted')
  }).catch(()=>{if(active)setMessage('Notifiche push non disponibili su questo dispositivo.')})
  return()=>{active=false;void audio.current?.close().catch(()=>{})}
 },[])
 function chime(){
  const context=audio.current
  if(!context||context.state!=='running')return
  for(const [index,frequency] of [660,880].entries()){
   const time=context.currentTime+index*.13,oscillator=context.createOscillator(),gain=context.createGain()
   oscillator.frequency.value=frequency
   gain.gain.setValueAtTime(.0001,time)
   gain.gain.exponentialRampToValueAtTime(.12,time+.018)
   gain.gain.exponentialRampToValueAtTime(.0001,time+.20)
   oscillator.connect(gain).connect(context.destination)
   oscillator.start(time);oscillator.stop(time+.22)
  }
 }
 useEffect(()=>{if(eventCount&&sound&&!document.hidden)chime()},[eventCount])
 async function toggleSound(){
  if(sound){setSound(false);return}
  try{
   if(!audio.current)audio.current=new AudioContext()
   await audio.current.resume()
   setSound(true);chime()
  }catch{setMessage('Il browser non consente la riproduzione del suono.')}
 }
 async function enable(){
  if(!registration||!key)return
  setBusy(true);setMessage('')
  try{
   if(await Notification.requestPermission()!=='granted')throw new Error('Consenti le notifiche nelle impostazioni del dispositivo.')
   const applicationServerKey=decodeKey(key)
   let sub=await registration.pushManager.getSubscription()
   if(sub&&!sameKey(sub,applicationServerKey)){await disableAdminPush();sub=null}
   sub ||= await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey})
   await api('/api/admin/push/subscribe',{method:'POST',body:JSON.stringify({subscription:sub.toJSON()})})
   setEnabled(true);setMessage('Notifiche push attivate su questo dispositivo.')
  }catch(error){setMessage(error instanceof Error?error.message:'Attivazione non riuscita.')}
  finally{setBusy(false)}
 }
 async function test(){
  setBusy(true);setMessage('')
  try{
   const subscription=await registration?.pushManager.getSubscription()
   if(!subscription)throw new Error('Attiva le notifiche su questo dispositivo.')
   await api('/api/admin/push/test',{method:'POST',body:JSON.stringify({endpoint:subscription.endpoint})})
   setMessage('Notifica di prova accettata dal servizio push.')
  }catch(error){setMessage(error instanceof Error?error.message:'Prova non riuscita.')}
  finally{setBusy(false)}
 }
 return <section className="admin-push-controls" aria-label="Notifiche ordini">
  <div><Bell size={18} aria-hidden="true"/><strong>Notifiche ordini</strong></div>
  <p>{enabled?'Push attive su questo dispositivo.':!supported()?'Apri la web app installata su iPhone o un browser compatibile.':key?'Attiva le push su questo dispositivo.':'Le push richiedono le chiavi Web Push su Cloudflare.'}</p>
  <div className="admin-push-actions">
   {registration&&(!enabled?<button type="button" disabled={busy} onClick={enable}>Attiva push</button>:<>
    <button type="button" disabled={busy} onClick={test}>Invia push di prova</button>
    <button type="button" disabled={busy} onClick={async()=>{setBusy(true);try{await disableAdminPush();setEnabled(false);setMessage('Push disattivate.')}catch{setMessage('Non è stato possibile aggiornare lo stato delle push.')}finally{setBusy(false)}}}>Disattiva push</button>
   </>)}
   <button type="button" aria-pressed={sound} onClick={toggleSound}><Volume2 size={16} aria-hidden="true"/> {sound?'Disattiva suono dashboard':'Attiva suono dashboard'}</button>
  </div>
  <small role="status">{message}</small>
 </section>
}
