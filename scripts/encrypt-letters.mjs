import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { randomBytes, webcrypto } from 'node:crypto'

const root = resolve(import.meta.dirname, '..')
const privateDir = resolve(root, '.private')
const privateLettersPath = resolve(privateDir, 'letters.json')
const passphrasePath = resolve(privateDir, 'letter-passphrase.txt')
const outputPath = resolve(root, 'public', 'letters.enc.json')

await mkdir(privateDir, { recursive: true })
await mkdir(dirname(outputPath), { recursive: true })

let letters
if (existsSync(privateLettersPath)) {
  letters = JSON.parse(await readFile(privateLettersPath, 'utf8'))
} else {
  const source = await readFile(resolve(root, 'src', 'letters.ts'), 'utf8')
  const start = source.indexOf('[', source.indexOf('export const letters'))
  const end = source.lastIndexOf(']')
  if (start < 0 || end < start) throw new Error('Unable to locate the letters array')
  letters = Function(`"use strict"; return (${source.slice(start, end + 1)})`)()
  await writeFile(privateLettersPath, `${JSON.stringify(letters, null, 2)}\n`, 'utf8')
}

const passphrase = existsSync(passphrasePath)
  ? (await readFile(passphrasePath, 'utf8')).trim()
  : randomBytes(18).toString('base64url')
if (!existsSync(passphrasePath)) await writeFile(passphrasePath, `${passphrase}\n`, 'utf8')

const encoder = new TextEncoder()
const salt = randomBytes(16)
const iv = randomBytes(12)
const material = await webcrypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
const key = await webcrypto.subtle.deriveKey(
  { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 250_000 },
  material,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt'],
)
const ciphertext = await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(letters)))
const encoded = (value) => Buffer.from(value).toString('base64')

await writeFile(outputPath, `${JSON.stringify({ version: 1, iterations: 250_000, salt: encoded(salt), iv: encoded(iv), ciphertext: encoded(ciphertext) })}\n`, 'utf8')
console.log(`Encrypted ${letters.length} letters. Private source and passphrase are stored in ${privateDir}`)
