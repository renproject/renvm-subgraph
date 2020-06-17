import { BigInt, Bytes } from "@graphprotocol/graph-ts";

import { Darknode, Integrator, PeriodData, RenVM } from "../generated/schema";
import { resolveIntegratorID } from "./integrators";

// @ts-ignore - typescript doesn't like i32

export type I32 = i32;

export const zero = (): BigInt => {
    return BigInt.fromI32(0);
};

export const one = (): BigInt => {
    return BigInt.fromI32(1);
};


export const getPeriodTimespan = (type: string): I32 => {
    if (type === "HOUR") {
        return 60 * 60;
    }
    if (type === "DAY") {
        return 60 * 60 * 24;
    }
    if (type === "WEEK") {
        return 60 * 60 * 24 * 7;
    }
    if (type === "MONTH") {
        return 60 * 60 * 24 * 31;
    }
    if (type === "YEAR") {
        return 60 * 60 * 24 * 365;
    }
    throw new Error(`Unknown period type ${type}`);
};

export const getIntegrator = (contractAddress: Bytes, timestamp: I32): Integrator => {
    let periodID: string = "";
    let date: I32 = 0;
    if (timestamp > 0) {
        let type: string = "DAY"
        let periodTimespan: I32 = getPeriodTimespan(type);
        let intPeriodID: I32 = timestamp / periodTimespan;
        date = intPeriodID * periodTimespan;
        periodID = type + intPeriodID.toString();
    }

    let integratorID: string = resolveIntegratorID(contractAddress) + periodID;
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

export const getRenVM = (): RenVM => {

    let renVM: RenVM | null = RenVM.load("1");

    if (renVM === null) {
        renVM = new RenVM("1");

        renVM.numberOfDarknodes = zero();
        renVM.numberOfDarknodesLastEpoch = zero();
        renVM.numberOfDarknodesNextEpoch = zero();

        renVM.minimumBond = zero();
        renVM.minimumEpochInterval = zero();
        renVM.deregistrationInterval = zero();

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

    // tslint:disable-next-line: no-unnecessary-type-assertion
    return renVM as RenVM;
};

export const getDayData = (timestamp: I32, type: string): PeriodData => {
    let periodTimespan: I32 = getPeriodTimespan(type);

    let intPeriodID: I32 = timestamp / periodTimespan;
    let periodStartTimestamp: I32 = intPeriodID * periodTimespan;
    let periodID: string = type + intPeriodID.toString();

    let renVM = getRenVM();

    let periodData: PeriodData | null = PeriodData.load(periodID);
    if (periodData == null) {

        periodData = new PeriodData(periodID);
        periodData.type = type;
        periodData.date = periodStartTimestamp;

        periodData.totalTxCountBTC = renVM.totalTxCountBTC;
        periodData.totalLockedBTC = renVM.totalLockedBTC;
        periodData.totalVolumeBTC = renVM.totalVolumeBTC;

        periodData.totalTxCountZEC = renVM.totalTxCountZEC;
        periodData.totalLockedZEC = renVM.totalLockedZEC;
        periodData.totalVolumeZEC = renVM.totalVolumeZEC;

        periodData.totalTxCountBCH = renVM.totalTxCountBCH;
        periodData.totalLockedBCH = renVM.totalLockedBCH;
        periodData.totalVolumeBCH = renVM.totalVolumeBCH;


        periodData.periodTxCountBTC = zero();
        periodData.periodLockedBTC = zero();
        periodData.periodVolumeBTC = zero();

        periodData.periodTxCountZEC = zero();
        periodData.periodLockedZEC = zero();
        periodData.periodVolumeZEC = zero();

        periodData.periodTxCountBCH = zero();
        periodData.periodLockedBCH = zero();
        periodData.periodVolumeBCH = zero();

        periodData.save();
    }

    // tslint:disable-next-line: no-unnecessary-type-assertion
    return periodData as PeriodData;

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
