// tslint:disable: only-arrow-functions prefer-for-of

import { BigInt, Bytes } from "@graphprotocol/graph-ts";

import { Gateway, LogBurn, LogMint } from "../generated/BCHGateway/Gateway";
import { Transaction } from "../generated/schema";
import { getDayData, getIntegrator, getRenVM, I32, oneBigInt } from "./common";

const periods: string[] = ["HOUR", "DAY", "WEEK", "MONTH", "YEAR"];

export function handleLogMint(event: LogMint): void {

    const txid = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
    const tx = new Transaction(txid);

    const contract = Gateway.bind(event.address);

    tx.createdTimestamp = event.block.timestamp;
    tx.asset = "BCH";
    tx.amount = event.params._amount;
    tx.feeRate = BigInt.fromI32(contract.mintFee());
    tx.type = "mint";
    tx.transactionTo = event.transaction.to;
    tx.integrator = event.params._to;
    tx.save();

    // Nov 2 2018 is 1541116800 for dayStartTimestamp and 17837 for dayID
    // Nov 3 2018 would be 1541116800 + 86400 and 17838. And so on, for each exchange
    const timestamp: I32 = event.block.timestamp.toI32();

    // Update Global Values
    const renVM = getRenVM();
    renVM.totalTxCountBCH = renVM.totalTxCountBCH.plus(oneBigInt());
    renVM.totalVolumeBCH = renVM.totalVolumeBCH.plus(tx.amount);
    renVM.totalLockedBCH = renVM.totalLockedBCH.plus(tx.amount);
    renVM.save();

    if (tx.integrator !== null) {
        const integrator = getIntegrator(tx.integrator as Bytes);
        integrator.totalTxCountBCH = integrator.totalTxCountBCH.plus(oneBigInt());
        integrator.totalVolumeBCH = integrator.totalVolumeBCH.plus(tx.amount);
        integrator.totalLockedBCH = integrator.totalLockedBCH.plus(tx.amount);
        integrator.save();
    }

    for (let i = 0; i < periods.length; i++) {
        const dayData = getDayData(timestamp, periods[i]);

        // save info
        dayData.periodTxCountBCH = dayData.periodTxCountBCH.plus(oneBigInt());
        dayData.periodVolumeBCH = dayData.periodVolumeBCH.plus(tx.amount);
        dayData.periodLockedBCH = dayData.periodLockedBCH.plus(tx.amount);

        dayData.totalTxCountBCH = renVM.totalTxCountBCH;
        dayData.totalVolumeBCH = renVM.totalVolumeBCH;
        dayData.totalLockedBCH = renVM.totalLockedBCH;

        dayData.save();
    }
}

export function handleLogBurn(event: LogBurn): void {
    const txid = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
    const tx = new Transaction(txid);

    const contract = Gateway.bind(event.address);
    const to = event.transaction.to;

    tx.createdTimestamp = event.block.timestamp;
    tx.asset = "RenBCH";
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
    renVM.totalTxCountBCH = renVM.totalTxCountBCH.plus(oneBigInt());
    renVM.totalVolumeBCH = renVM.totalVolumeBCH.plus(tx.amount);
    renVM.totalLockedBCH = renVM.totalLockedBCH.minus(tx.amount);
    renVM.save();

    for (let i = 0; i < periods.length; i++) {
        const dayData = getDayData(timestamp, periods[i]);

        // save info
        dayData.periodTxCountBCH = dayData.periodTxCountBCH.plus(oneBigInt());
        dayData.periodVolumeBCH = dayData.periodVolumeBCH.plus(tx.amount);
        dayData.periodLockedBCH = dayData.periodLockedBCH.minus(tx.amount);

        dayData.totalTxCountBCH = renVM.totalTxCountBCH;
        dayData.totalVolumeBCH = renVM.totalVolumeBCH;
        dayData.totalLockedBCH = renVM.totalLockedBCH;

        dayData.save();
    }

}
