const { generateSalt, deriveKey, encryptText, decryptText } = require("../.tmp-node/lib/encryption");

describe("Encryption utils", () => {
  test("round-trip", () => {
    const salt = generateSalt();
    const key = deriveKey("password", salt);
    const msg = "hello";
    const cipher = encryptText(msg, key);
    expect(cipher).not.toEqual(msg);
    expect(decryptText(cipher, key)).toEqual(msg);
  });

  test("wrong key fails", () => {
    const salt = generateSalt();
    const keyA = deriveKey("a", salt);
    const keyB = deriveKey("b", salt);
    const cipher = encryptText("secret", keyA);
    expect(decryptText(cipher, keyB)).not.toEqual("secret");
  });
}); 