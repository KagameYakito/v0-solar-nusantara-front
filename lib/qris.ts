/**
 * QRIS Utility Library
 * Ported from https://github.com/IR-design/qris
 *
 * Converts a static QRIS string to a dynamic one by embedding
 * a specific payment amount and recalculating the CRC-16 checksum.
 */

/**
 * CRC-16/CCITT-FALSE checksum used by QRIS standard.
 */
export function crc16(str: string): number {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc <<= 1
      }
    }
  }
  return crc & 0xffff
}

/**
 * Convert a static QRIS string to a dynamic one with a given amount.
 * @param staticQris  The raw QRIS string read from the static QR code image.
 * @param amount      Transaction amount in IDR (integer). 0 = no amount tag added.
 * @returns           The modified QRIS string (dynamic) ready to be encoded as QR.
 */
export function generateDynamicQris(staticQris: string, amount: number): string {
  let qris = staticQris.trim()

  // 1. Switch from static (010211) to dynamic (010212) payment indicator
  qris = qris.replace('010211', '010212')

  // 2. Locate CRC tag — always the last occurrence of '6304'
  const crcPos = qris.lastIndexOf('6304')
  if (crcPos === -1) throw new Error('QRIS tidak valid: tag CRC (6304) tidak ditemukan')

  // Remove the existing 4-char CRC value; keep only the body before '6304'
  let body = qris.substring(0, crcPos)

  // 3. Inject amount tag (ID 54) when amount > 0
  if (amount > 0) {
    const amountStr = String(Math.round(amount))
    const tag = '54' + amountStr.length.toString().padStart(2, '0') + amountStr
    body += tag
  }

  // 4. Re-attach CRC header and calculate fresh CRC
  body += '6304'
  const checksum = crc16(body)
  body += checksum.toString(16).toUpperCase().padStart(4, '0')

  return body
}

/**
 * Validate that a QRIS string looks structurally plausible.
 * Does NOT perform a full EMVCo-compliant parse — only checks key markers.
 */
export function isValidQris(qris: string): boolean {
  const trimmed = qris.trim()
  return (
    (trimmed.startsWith('000201') || trimmed.startsWith('00020101')) &&
    trimmed.includes('6304') &&
    trimmed.length > 20
  )
}
