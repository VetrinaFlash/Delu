import fs from 'node:fs/promises'

const base=(process.env.PRODUCTION_URL||'https://delu-49u.pages.dev').replace(/\/$/,'')
const expected=JSON.parse(await fs.readFile(new URL('../public/release.json',import.meta.url),'utf8')).release
let last=''

for(let attempt=1;attempt<=60;attempt++){
  try{
    const response=await fetch(`${base}/release.json?qa=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache'}})
    if(response.ok){
      const data=await response.json()
      last=data.release||''
      if(last===expected){
        console.log(`Production release ready: ${expected}`)
        process.exit(0)
      }
    }
  }catch{}
  await new Promise(resolve=>setTimeout(resolve,5_000))
}

console.error(`Production release mismatch. Expected ${expected}, saw ${last||'nothing'}.`)
process.exit(1)
