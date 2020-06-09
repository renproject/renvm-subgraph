import { Bytes } from "@graphprotocol/graph-ts";

export const resolveIntegratorID = (address: Bytes): string => {
    let addressHex = address.toHexString();
    // Use "==" instead of "===", which compares string references, not values.
    if (addressHex == "0xc995c7cb6a3faecc8a3e033575b3592f727455f8") return "curve";
    if (addressHex == "0x2407750d9e57990559b6be9c17ea200cbdf17b93") return "curve";
    if (addressHex == "0x12330dc239ca6c353c37842126fa7d08ba5b3d06") return "curve";
    if (addressHex == "0x6d43159989921210cefe4337c24b51f1004fe032") return "curve";
    return address.toHexString();
}
