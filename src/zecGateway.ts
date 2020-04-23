// tslint:disable: only-arrow-functions prefer-for-of

import { BigInt } from "@graphprotocol/graph-ts";

import { Transaction } from "../generated/schema";
import { Gateway, LogBurn, LogMint } from "../generated/ZECGateway/Gateway";
import { getDayData, getIntegrator, getRenVM, I32, oneBigInt } from "./common";

const periods: string[] = ["HOUR", "DAY", "WEEK", "MONTH", "YEAR"];

export function handleLogMint(event: LogMint): void {

    const txid = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
    const tx = new Transaction(txid);

    const contract = Gateway.bind(event.address);
    const to = event.transaction.to;

    tx.createdTimestamp = event.block.timestamp;
    tx.asset = "ZEC";
    tx.amount = event.params._amount;
    tx.feeRate = BigInt.fromI32(contract.mintFee());
    tx.type = "mint";
    tx.adapterAddress = to;
    tx.save();

    // Nov 2 2018 is 1541116800 for dayStartTimestamp and 17837 for dayID
    // Nov 3 2018 would be 1541116800 + 86400 and 17838. And so on, for each exchange
    const timestamp: I32 = event.block.timestamp.toI32();

    // Update Global Values
    const renVM = getRenVM();
    renVM.totalTxCountZEC = renVM.totalTxCountZEC.plus(oneBigInt());
    renVM.totalVolumeZEC = renVM.totalVolumeZEC.plus(tx.amount);
    renVM.totalLockedZEC = renVM.totalLockedZEC.plus(tx.amount);
    renVM.save();

    const integrator = getIntegrator(tx.adapterAddress);
    integrator.totalTxCountZEC = integrator.totalTxCountZEC.plus(oneBigInt());
    integrator.totalVolumeZEC = integrator.totalVolumeZEC.plus(tx.amount);
    integrator.totalLockedZEC = integrator.totalLockedZEC.plus(tx.amount);
    integrator.save();

    for (let i = 0; i < periods.length; i++) {
        const dayData = getDayData(timestamp, periods[i]);

        // save info
        dayData.periodTxCountZEC = dayData.periodTxCountZEC.plus(oneBigInt());
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
    tx.asset = "RenZEC";
    tx.amount = event.params._amount;
    tx.feeRate = BigInt.fromI32(contract.burnFee());
    tx.type = "burn";
    tx.adapterAddress = to;
    tx.save();

    // Nov 2 2018 is 1541116800 for dayStartTimestamp and 17837 for dayID
    // Nov 3 2018 would be 1541116800 + 86400 and 17838. And so on, for each exchange
    const timestamp: I32 = event.block.timestamp.toI32();

    // Update Global Values
    const renVM = getRenVM();
    renVM.totalTxCountZEC = renVM.totalTxCountZEC.plus(oneBigInt());
    renVM.totalVolumeZEC = renVM.totalVolumeZEC.plus(tx.amount);
    renVM.totalLockedZEC = renVM.totalLockedZEC.minus(tx.amount);
    renVM.save();

    for (let i = 0; i < periods.length; i++) {
        const dayData = getDayData(timestamp, periods[i]);

        // save info
        dayData.periodTxCountZEC = dayData.periodTxCountZEC.plus(oneBigInt());
        dayData.periodVolumeZEC = dayData.periodVolumeZEC.plus(tx.amount);
        dayData.periodLockedZEC = dayData.periodLockedZEC.minus(tx.amount);

        dayData.totalTxCountZEC = renVM.totalTxCountZEC;
        dayData.totalVolumeZEC = renVM.totalVolumeZEC;
        dayData.totalLockedZEC = renVM.totalLockedZEC;

        dayData.save();
    }

}
