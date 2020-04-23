import { BigInt, Bytes } from "@graphprotocol/graph-ts";

import { Integrator, PeriodData, RenVM } from "../generated/schema";

// @ts-ignore
export type I32 = i32;

export const zeroBigInt = (): BigInt => {
    return BigInt.fromI32(0);
};

export const oneBigInt = (): BigInt => {
    return BigInt.fromI32(1);
};

export const getIntegrator = (contractAddress: Bytes): Integrator => {

    const integratorID = contractAddress.toHex();
    let integrator: Integrator | null = Integrator.load(integratorID);

    if (integrator === null) {
        integrator = new Integrator(integratorID);
        integrator.contractAddress = contractAddress;
        integrator.totalTxCountBTC = zeroBigInt();
        integrator.totalLockedBTC = zeroBigInt();
        integrator.totalVolumeBTC = zeroBigInt();

        integrator.totalTxCountZEC = zeroBigInt();
        integrator.totalLockedZEC = zeroBigInt();
        integrator.totalVolumeZEC = zeroBigInt();

        integrator.totalTxCountBCH = zeroBigInt();
        integrator.totalLockedBCH = zeroBigInt();
        integrator.totalVolumeBCH = zeroBigInt();

        integrator.save();
    }

    // tslint:disable-next-line: no-unnecessary-type-assertion
    return integrator as Integrator;
};

export const getRenVM = (): RenVM => {

    let renVM: RenVM | null = RenVM.load("1");

    if (renVM === null) {
        renVM = new RenVM("1");
        renVM.totalTxCountBTC = zeroBigInt();
        renVM.totalLockedBTC = zeroBigInt();
        renVM.totalVolumeBTC = zeroBigInt();

        renVM.totalTxCountZEC = zeroBigInt();
        renVM.totalLockedZEC = zeroBigInt();
        renVM.totalVolumeZEC = zeroBigInt();

        renVM.totalTxCountBCH = zeroBigInt();
        renVM.totalLockedBCH = zeroBigInt();
        renVM.totalVolumeBCH = zeroBigInt();

        renVM.save();
    }

    // tslint:disable-next-line: no-unnecessary-type-assertion
    return renVM as RenVM;
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

export const getDayData = (timestamp: I32, type: string): PeriodData => {
    const periodTimespan = getPeriodTimespan(type);

    const intPeriodID: I32 = timestamp / periodTimespan;
    const periodStartTimestamp: I32 = intPeriodID * periodTimespan;
    const periodID: string = type + intPeriodID.toString();

    let periodData: PeriodData | null = PeriodData.load(periodID);
    if (periodData == null) {

        periodData = new PeriodData(periodID);
        periodData.type = type;
        periodData.date = periodStartTimestamp;

        periodData.totalTxCountBTC = zeroBigInt();
        periodData.totalLockedBTC = zeroBigInt();
        periodData.totalVolumeBTC = zeroBigInt();

        periodData.totalTxCountZEC = zeroBigInt();
        periodData.totalLockedZEC = zeroBigInt();
        periodData.totalVolumeZEC = zeroBigInt();

        periodData.totalTxCountBCH = zeroBigInt();
        periodData.totalLockedBCH = zeroBigInt();
        periodData.totalVolumeBCH = zeroBigInt();


        periodData.periodTxCountBTC = zeroBigInt();
        periodData.periodLockedBTC = zeroBigInt();
        periodData.periodVolumeBTC = zeroBigInt();

        periodData.periodTxCountZEC = zeroBigInt();
        periodData.periodLockedZEC = zeroBigInt();
        periodData.periodVolumeZEC = zeroBigInt();

        periodData.periodTxCountBCH = zeroBigInt();
        periodData.periodLockedBCH = zeroBigInt();
        periodData.periodVolumeBCH = zeroBigInt();

        periodData.save();
    }

    // tslint:disable-next-line: no-unnecessary-type-assertion
    return periodData as PeriodData;

};
