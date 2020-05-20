import { BigInt, Bytes } from "@graphprotocol/graph-ts";

import { Integrator, PeriodData, RenVM } from "../generated/schema";

// @ts-ignore
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
    let periodID = "";
    let date: I32 = 0;
    if (timestamp > 0) {
        const type = "DAY"
        const periodTimespan = getPeriodTimespan(type);
        const intPeriodID: I32 = timestamp / periodTimespan;
        date = intPeriodID * periodTimespan;
        periodID = type + intPeriodID.toString();
    }

    const integratorID = contractAddress.toHex() + periodID;
    let integrator: Integrator | null = Integrator.load(integratorID);

    if (integrator === null) {
        integrator = new Integrator(integratorID);
        integrator.contractAddress = contractAddress;
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

        integrator.save();
    }

    // tslint:disable-next-line: no-unnecessary-type-assertion
    return integrator as Integrator;
};

export const getRenVM = (): RenVM => {

    let renVM: RenVM | null = RenVM.load("1");

    if (renVM === null) {
        renVM = new RenVM("1");
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
    const periodTimespan = getPeriodTimespan(type);

    const intPeriodID: I32 = timestamp / periodTimespan;
    const periodStartTimestamp: I32 = intPeriodID * periodTimespan;
    const periodID: string = type + intPeriodID.toString();

    const renVM = getRenVM();

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
