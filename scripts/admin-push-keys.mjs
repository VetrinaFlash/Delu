import { generateKeyPairSync } from 'node:crypto'
const {privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'})
const {x,y,d}=privateKey.export({format:'jwk'})
const publicKey=Buffer.concat([Buffer.from([4]),Buffer.from(x,'base64url'),Buffer.from(y,'base64url')])
console.log('WEB_PUSH_PUBLIC_KEY='+publicKey.toString('base64url'))
console.log('WEB_PUSH_PRIVATE_KEY='+d)
console.log('WEB_PUSH_SUBJECT=mailto:info@deluclothesshop.it')
