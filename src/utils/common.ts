import {
    BigDecimal,
    BigInt,
    Bytes,
    ethereum,
    Address
} from "@graphprotocol/graph-ts";
import { RenERC20 } from "../../generated/GatewayRegistry/RenERC20";

import {
    Darknode,
    Integrator,
    IntegratorContract,
    RenVM
} from "../../generated/schema";
import { resolveIntegratorID } from "../integrators";

// @ts-ignore - typescript doesn't like i32
export type I32 = i32;

export const zero = (): BigInt => {
    return BigInt.fromI32(0);
};

export const zeroDot = (): BigDecimal => {
    return BigInt.fromI32(0).toBigDecimal();
};

export const one = (): BigInt => {
    return BigInt.fromI32(1);
};

export const oneDot = (): BigDecimal => {
    return BigInt.fromI32(1).toBigDecimal();
};

let ethAddress = Address.fromString(
    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
);
let mainnetSai = Address.fromString(
    "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359"
);

export const getTokenSymbol = (
    token: RenERC20
): ethereum.CallResult<string> => {
    if (token._address.equals(ethAddress)) {
        return ethereum.CallResult.fromValue("ETH");
    }

    // Returns bytes32 instead of string
    if (token._address.equals(mainnetSai)) {
        return ethereum.CallResult.fromValue("SAI");
    }

    return token.try_symbol();
};

export const getIntegrator = (contractAddress: Bytes): Integrator => {
    let date: I32 = 0;

    let integratorID: string = resolveIntegratorID(contractAddress);
    let integrator: Integrator | null = Integrator.load(integratorID);

    if (integrator === null) {
        integrator = new Integrator(integratorID);
        integrator.txCountBTC = zero();
        integrator.lockedBTC = zero();
        integrator.volumeBTC = zero();

        integrator.txCountZEC = zero();
        integrator.lockedZEC = zero();
        integrator.volumeZEC = zero();

        integrator.txCountBCH = zero();
        integrator.lockedBCH = zero();
        integrator.volumeBCH = zero();

        integrator.txCount = [];
        integrator.locked = [];
        integrator.volume = [];
        integrator.fees = [];

        integrator.txCountTotal = zero();
        integrator.volumeTotalUSD = zeroDot();
        integrator.feesTotalUSD = zeroDot();

        integrator.date = date;
    }

    // If there are multiple contracts associated with an integrator, store the
    // most recent contract.
    integrator.contractAddress = contractAddress;
    integrator.save();

    // tslint:disable-next-line: no-unnecessary-type-assertion
    return integrator as Integrator;
};

export const getIntegratorContract = (
    contractAddress: Bytes
): IntegratorContract => {
    let date: I32 = 0;

    let integratorContractID: string = contractAddress.toHexString();
    let integratorContract: IntegratorContract | null = IntegratorContract.load(
        integratorContractID
    );

    if (integratorContract === null) {
        integratorContract = new IntegratorContract(integratorContractID);
        integratorContract.txCountBTC = zero();
        integratorContract.lockedBTC = zero();
        integratorContract.volumeBTC = zero();

        integratorContract.txCountZEC = zero();
        integratorContract.lockedZEC = zero();
        integratorContract.volumeZEC = zero();

        integratorContract.txCountBCH = zero();
        integratorContract.lockedBCH = zero();
        integratorContract.volumeBCH = zero();

        integratorContract.txCount = [];
        integratorContract.locked = [];
        integratorContract.volume = [];
        integratorContract.fees = [];

        integratorContract.date = date;
    }

    // If there are multiple contracts associated with an integratorContract, store the
    // most recent contract.
    integratorContract.contractAddress = contractAddress;
    integratorContract.save();

    // tslint:disable-next-line: no-unnecessary-type-assertion
    return integratorContract as IntegratorContract;
};

export const getRenVM = (updateAtBlock: ethereum.Block): RenVM => {
    let renVM: RenVM | null = RenVM.load("1");

    if (renVM === null) {
        renVM = new RenVM("1");

        renVM.activeBlock = zero();
        renVM.activeTimestamp = zero();
        renVM.previousActiveBlock = zero();
        renVM.previousActiveTimestamp = zero();

        renVM.numberOfDarknodes = zero();
        renVM.numberOfDarknodesLastEpoch = zero();
        renVM.numberOfDarknodesNextEpoch = zero();
        renVM.pendingRegistrations = zero();
        renVM.pendingDeregistrations = zero();

        renVM.minimumBond = zero();
        renVM.minimumEpochInterval = zero();
        renVM.deregistrationInterval = zero();

        renVM.btcMintFee = 0;
        renVM.btcBurnFee = 0;
        renVM.zecMintFee = 0;
        renVM.zecBurnFee = 0;
        renVM.bchMintFee = 0;
        renVM.bchBurnFee = 0;

        renVM.currentCycle = zero();
        renVM.previousCycle = zero();
        renVM.currentCyclePayoutPercent = zero();
        renVM.cycleStartTime = zero();

        renVM.totalTxCountBTC = zero();
        renVM.totalLockedBTC = zero();
        renVM.totalVolumeBTC = zero();

        renVM.totalTxCountZEC = zero();
        renVM.totalLockedZEC = zero();
        renVM.totalVolumeZEC = zero();

        renVM.totalTxCountBCH = zero();
        renVM.totalLockedBCH = zero();
        renVM.totalVolumeBCH = zero();

        renVM.mintFee = [];
        renVM.burnFee = [];
        renVM.txCount = [];
        renVM.locked = [];
        renVM.volume = [];
        renVM.fees = [];
        renVM.cycleRewards = [];

        renVM.save();
    }

    renVM.previousActiveBlock = renVM.activeBlock;
    renVM.previousActiveTimestamp = renVM.activeTimestamp;
    renVM.activeBlock = updateAtBlock.number;
    renVM.activeTimestamp = updateAtBlock.timestamp;
    renVM.save();

    // tslint:disable-next-line: no-unnecessary-type-assertion
    return renVM as RenVM;
};

export const getDarknode = (darknodeID: Bytes): Darknode => {
    let darknode: Darknode | null = Darknode.load(darknodeID.toHexString());
    if (darknode == null) {
        darknode = new Darknode(darknodeID.toHexString());

        darknode.operator = Bytes.fromI32(0) as Bytes;
        darknode.bond = zero();
        darknode.registeredAt = zero();
        darknode.deregisteredAt = zero();
        darknode.publicKey = Bytes.fromI32(0) as Bytes;

        darknode.lastClaimedEpoch = zero();
        darknode.previousLastClaimedEpoch = zero();

        darknode.balanceBTC = zero();
        darknode.balanceZEC = zero();
        darknode.balanceBCH = zero();

        darknode.balances = [];

        darknode.save();
    }

    // tslint:disable-next-line: no-unnecessary-type-assertion
    return darknode as Darknode;
};
