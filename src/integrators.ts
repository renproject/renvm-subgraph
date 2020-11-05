import { Bytes } from "@graphprotocol/graph-ts";

export const resolveIntegratorID = (address: Bytes): string => {
    let addressHex = address.toHexString();
    // @dev Use "==" instead of "===", which compares string references, not values.

    // Mainnet

    if (addressHex == "0xc995c7cb6a3faecc8a3e033575b3592f727455f8")
        return "curve";
    if (addressHex == "0x2407750d9e57990559b6be9c17ea200cbdf17b93")
        return "curve";
    if (addressHex == "0x12330dc239ca6c353c37842126fa7d08ba5b3d06")
        return "curve";
    if (addressHex == "0x6d43159989921210cefe4337c24b51f1004fe032")
        return "curve";
    if (addressHex == "0x9fe350dfa5f66bc086243f21a8f0932514316627")
        return "curve";
    if (addressHex == "0x818ba18eba3b874c993302d4770c46e0c02d0ed3")
        return "curve";
    if (addressHex == "0x104c1e66c67c385e6095ffcc6227d75c761dc019")
        return "curve";
    if (addressHex == "0x02b3f51ac9202aa19be63d61a8c681579d6e3a51")
        return "curve";
    if (addressHex == "0x26d9980571e77ffb0349f9c801dd7ca9951fb656")
        return "curve";
    if (addressHex == "0x7a9575b7985dd34fc4a2095bd1456290c8c89c32")
        return "curve";
    if (addressHex == "0x73ab2bd10ad10f7174a1ad5afae3ce3d991c5047")
        return "curve";
    if (addressHex == "0xaeade605d01fe9a8e9c4b3aa0130a90d62167029")
        return "curve";

    if (addressHex == "0x1160c98bfeec42a329aebbf27e4ed4d43007ce99")
        return "RenEscrow";
    if (addressHex == "0x865b7c35302fb9c33f72a2b3f935dd194da9f0b7")
        return "RenEscrow";
    if (addressHex == "0x4fd7f06f4eb0e57c0e1a3b50b53a8c278b9bc568")
        return "RenEscrow";
    if (addressHex == "0x493d490d84053fed122035d8889d88a9c492f7fa")
        return "RenEscrow";
    if (addressHex == "0x8fe7e17d20af82258e3ad798ef781add8c060dbf")
        return "RenEscrow";
    if (addressHex == "0x15632dcfba89c33f9bc0ffed0380b1319be57223")
        return "RenEscrow";

    // Testnet

    if (addressHex == "0x8fb1a3e0eb443a91f28728b8799f5f0eb8a51f96")
        return "curve";
    if (addressHex == "0x3973b2acdfac17171315e49ef19a0758b8b6f104")
        return "curve";

    return addressHex;
};
