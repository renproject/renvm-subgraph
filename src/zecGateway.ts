// tslint:disable: only-arrow-functions prefer-for-of

import { BigInt, Bytes } from "@graphprotocol/graph-ts";

import { Integrator, Transaction } from "../generated/schema";
import { Gateway, LogBurn, LogMint } from "../generated/ZECGateway/Gateway";
import { getDayData, getIntegrator, getRenVM, I32, one } from "./common";

const periods: string[] = ["HOUR", "DAY", "WEEK", "MONTH", "YEAR"];

export function handleLogMint(event: LogMint): void {

    const txid = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
    const tx = new Transaction(txid);

    const gateway = Gateway.bind(event.address);

    tx.createdTimestamp = event.block.timestamp;
    tx.asset = "ZEC";
    tx.amount = event.params._amount;
    tx.feeRate = BigInt.fromI32(gateway.mintFee());
    tx.type = "mint";
    tx.transactionTo = event.transaction.to;
    tx.integrator = event.params._to;
    tx.save();

    // Nov 2 2018 is 1541116800 for dayStartTimestamp and 17837 for dayID
    // Nov 3 2018 would be 1541116800 + 86400 and 17838. And so on, for each exchange
    const timestamp: I32 = event.block.timestamp.toI32();

    // Update Global Values
    const renVM = getRenVM();
    renVM.totalTxCountZEC = renVM.totalTxCountZEC.plus(one());
    renVM.totalVolumeZEC = renVM.totalVolumeZEC.plus(tx.amount);
    renVM.totalLockedZEC = renVM.totalLockedZEC.plus(tx.amount);
    renVM.save();

    if (!event.transaction.to.equals(gateway._address)) {
        if (tx.integrator !== null) {

            const integrator24H: Integrator = getIntegrator(tx.integrator as Bytes, timestamp);
            integrator24H.txCountZEC = integrator24H.txCountZEC.plus(one());
            integrator24H.volumeZEC = integrator24H.volumeZEC.plus(tx.amount);
            integrator24H.lockedZEC = integrator24H.lockedZEC.plus(tx.amount);
            integrator24H.save();

            const integrator = getIntegrator(tx.integrator as Bytes, 0);
            integrator.txCountZEC = integrator.txCountZEC.plus(one());
            integrator.volumeZEC = integrator.volumeZEC.plus(tx.amount);
            integrator.lockedZEC = integrator.lockedZEC.plus(tx.amount);
            integrator.integrator24H = integrator24H.id;
            integrator.save();
        }
    }

    for (let i = 0; i < periods.length; i++) {
        const dayData = getDayData(timestamp, periods[i]);

        // save info
        dayData.periodTxCountZEC = dayData.periodTxCountZEC.plus(one());
        dayData.periodVolumeZEC = dayData.periodVolumeZEC.plus(tx.amount);
        dayData.periodLockedZEC = dayData.periodLockedZEC.plus(tx.amount);

        dayData.totalTxCountZEC = renVM.totalTxCountZEC;
        dayData.totalVolumeZEC = renVM.totalVolumeZEC;
        dayData.totalLockedZEC = renVM.totalLockedZEC;

        dayData.save();
    }
}

export function handleLogBurn(event: LogBurn): void {
    const txid = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
    const tx = new Transaction(txid);

    const contract = Gateway.bind(event.address);
    const to = event.transaction.to;

    tx.createdTimestamp = event.block.timestamp;
    tx.asset = "ZEC";
    tx.amount = event.params._amount;
    tx.feeRate = BigInt.fromI32(contract.burnFee());
    tx.type = "burn";
    tx.integrator = to;
    tx.save();

    // Nov 2 2018 is 1541116800 for dayStartTimestamp and 17837 for dayID
    // Nov 3 2018 would be 1541116800 + 86400 and 17838. And so on, for each exchange
    const timestamp: I32 = event.block.timestamp.toI32();

    // Update Global Values
    const renVM = getRenVM();
    renVM.totalTxCountZEC = renVM.totalTxCountZEC.plus(one());
    renVM.totalVolumeZEC = renVM.totalVolumeZEC.plus(tx.amount);
    renVM.totalLockedZEC = renVM.totalLockedZEC.minus(tx.amount);
    renVM.save();

    for (let i = 0; i < periods.length; i++) {
        const dayData = getDayData(timestamp, periods[i]);

        // save info
        dayData.periodTxCountZEC = dayData.periodTxCountZEC.plus(one());
        dayData.periodVolumeZEC = dayData.periodVolumeZEC.plus(tx.amount);
        dayData.periodLockedZEC = dayData.periodLockedZEC.minus(tx.amount);

        dayData.totalTxCountZEC = renVM.totalTxCountZEC;
        dayData.totalVolumeZEC = renVM.totalVolumeZEC;
        dayData.totalLockedZEC = renVM.totalLockedZEC;

        dayData.save();
    }

}
