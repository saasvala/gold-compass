// AES-256-GCM encryption for broker credentials + HMAC signing helpers.
// Falls back to reading legacy base64 "::enc" values so existing rows keep working.

const KEY_MATERIAL = Deno.env.get("BROKER_ENCRYPTION_KEY") ?? "";

async function getKey(): Promise<CryptoKey> {
  if (!KEY_MATERIAL) throw new Error("BROKER_ENCRYPTION_KEY not configured");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(KEY_MATERIAL));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromB64(value: string): Uint8Array {
  const bin = atob(value);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encryptSecret(plain: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain)),
  );
  return `v2::${toB64(iv)}::${toB64(cipher)}`;
}

export async function decryptSecret(stored: string): Promise<string> {
  if (!stored) return "";
  if (stored.startsWith("v2::")) {
    const [, ivB64, dataB64] = stored.split("::");
    const key = await getKey();
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromB64(ivB64) },
      key,
      fromB64(dataB64),
    );
    return new TextDecoder().decode(plain);
  }
  // legacy format: base64 + "::enc"
  return atob(stored.replace("::enc", ""));
}

export async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  return Array.from(sig).map((b) => b.toString(16).padStart(2, "0")).join("");
}
