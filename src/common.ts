import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import { Darknode, Integrator, RenVM } from "../generated/schema";
import { resolveIntegratorID } from "./integrators";

// @ts-ignore - typescript doesn't like i32

export type I32 = i32;

export const zero = (): BigInt => {
    return BigInt.fromI32(0);
};

export const one = (): BigInt => {
    return BigInt.fromI32(1);
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

        integrator.date = date;
    }

    // If there are multiple contracts associated with an integrator, store the
    // most recent contract.
    integrator.contractAddress = contractAddress;
    integrator.save();

    // tslint:disable-next-line: no-unnecessary-type-assertion
    return integrator as Integrator;
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

        renVM.minimumBond = zero();
        renVM.minimumEpochInterval = zero();
        renVM.deregistrationInterval = zero();

        renVM.btcMintFee = zero();
        renVM.btcBurnFee = zero();
        renVM.zecMintFee = zero();
        renVM.zecBurnFee = zero();
        renVM.bchMintFee = zero();
        renVM.bchBurnFee = zero();

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

        darknode.save();
    }

    // tslint:disable-next-line: no-unnecessary-type-assertion
    return darknode as Darknode;
};
