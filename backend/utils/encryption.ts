import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Fallback key only for dev if not provided
const SECRET_KEY = process.env.MARKETING_AES_KEY || 'a7d3f82b9e4c1a5f6d8b3c9a2f1e4d7b';
const IV_LENGTH = 16; 

export function encryptString(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY.slice(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptString(text: string): string {
    if (!text || !text.includes(':')) return text; // Not encrypted
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY.slice(0, 32)), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        console.error("Decryption error", e);
        return "";
    }
}
