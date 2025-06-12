import { generateSalt, deriveKey, encryptText, decryptText } from "@/lib/encryption";

describe("Encryption utilities", () => {
  it("round-trips encrypt/decrypt", () => {
    const salt = generateSalt();
    const key = deriveKey("pAssw0rd!", salt);
    const msg = "Hello Coloré";
    const cipher = encryptText(msg, key);
    expect(cipher).not.toEqual(msg);
    expect(decryptText(cipher, key)).toEqual(msg);
  });

  it("fails with wrong key", () => {
    const salt = generateSalt();
    const keyA = deriveKey("A", salt);
    const keyB = deriveKey("B", salt);
    const cipher = encryptText("Secret", keyA);
    expect(decryptText(cipher, keyB)).not.toEqual("Secret");
  });
}); 