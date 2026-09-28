export interface Letter {
  id: string
  text: string
}

interface EncryptedLetters {
  version: number
  iterations: number
  salt: string
  iv: string
  ciphertext: string
}

const decodeBase64 = (value: string) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0))

export async function unlockLetters(passphrase: string): Promise<Letter[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}letters.enc.json`, { cache: 'no-store' })
  if (!response.ok) throw new Error('无法读取信件')
  const payload = await response.json() as EncryptedLetters
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: decodeBase64(payload.salt), iterations: payload.iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: decodeBase64(payload.iv) },
    key,
    decodeBase64(payload.ciphertext),
  )
  const letters = JSON.parse(new TextDecoder().decode(plaintext)) as Letter[]
  if (!Array.isArray(letters) || letters.some((letter) => typeof letter?.text !== 'string')) {
    throw new Error('信件格式无效')
  }
  return letters
}
