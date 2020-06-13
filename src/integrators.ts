import { Bytes } from "@graphprotocol/graph-ts";

export const resolveIntegratorID = (address: Bytes): string => {
    let addressHex = address.toHexString();
    // @dev Use "==" instead of "===", which compares string references, not values.

    // Mainnet
    if (addressHex == "0xc995c7cb6a3faecc8a3e033575b3592f727455f8") return "curve";
    if (addressHex == "0x2407750d9e57990559b6be9c17ea200cbdf17b93") return "curve";
    if (addressHex == "0x12330dc239ca6c353c37842126fa7d08ba5b3d06") return "curve";
    if (addressHex == "0x6d43159989921210cefe4337c24b51f1004fe032") return "curve";
    if (addressHex == "0x9fe350dfa5f66bc086243f21a8f0932514316627") return "curve";

    // Testnet
    if (addressHex == "0x3973b2acdfac17171315e49ef19a0758b8b6f104") return "curve";
    if (addressHex == "0x8fb1a3e0eb443a91f28728b8799f5f0eb8a51f96") return "curve";

    return address.toHexString();
}
