// tslint:disable: only-arrow-functions prefer-for-of

import { BigInt, Bytes } from "@graphprotocol/graph-ts";

import { Gateway, LogBurn, LogMint } from "../generated/BTCGateway/Gateway";
import { Transaction } from "../generated/schema";
import { getDayData, getIntegrator, getRenVM, I32, oneBigInt } from "./common";

const periods: string[] = ["HOUR", "DAY", "WEEK", "MONTH", "YEAR"];

export function handleLogMint(event: LogMint): void {

    const txid = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
    const tx = new Transaction(txid);

    const contract = Gateway.bind(event.address);

    tx.createdTimestamp = event.block.timestamp;
    tx.asset = "BTC";
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
    renVM.totalTxCountBTC = renVM.totalTxCountBTC.plus(oneBigInt());
    renVM.totalVolumeBTC = renVM.totalVolumeBTC.plus(tx.amount);
    renVM.totalLockedBTC = renVM.totalLockedBTC.plus(tx.amount);
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
        dayData.periodTxCountBTC = dayData.periodTxCountBTC.plus(oneBigInt());
        dayData.periodVolumeBTC = dayData.periodVolumeBTC.plus(tx.amount);
        dayData.periodLockedBTC = dayData.periodLockedBTC.plus(tx.amount);

        dayData.totalTxCountBTC = renVM.totalTxCountBTC;
        dayData.totalVolumeBTC = renVM.totalVolumeBTC;
        dayData.totalLockedBTC = renVM.totalLockedBTC;

        dayData.save();
    }

    // It is also possible to access smart contracts from mappings. For
    // example, the contract that has emitted the event can be connected to
    // with:
    //
    // let contract = Contract.bind(event.address)
    //
    // The following functions can then be called on this contract to access
    // state variables and other data:
    //
    // - contract.feeRecipient(...)
    // - contract.hashForSignature(...)
    // - contract.isOwner(...)
    // - contract.minShiftAmount(...)
    // - contract.mintAuthority(...)
    // - contract.nextShiftID(...)
    // - contract.owner(...)
    // - contract.shiftIn(...)
    // - contract.mintFee(...)
    // - contract.shiftOut(...)
    // - contract.shiftOutFee(...)
    // - contract.status(...)
    // - contract.token(...)
    // - contract.verifySignature(...)
    // - contract.version(...)
}

export function handleLogBurn(event: LogBurn): void {
    const txid = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
    const tx = new Transaction(txid);

    const contract = Gateway.bind(event.address);
    const to = event.transaction.to;

    tx.createdTimestamp = event.block.timestamp;
    tx.asset = "BTC";
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
    renVM.totalTxCountBTC = renVM.totalTxCountBTC.plus(oneBigInt());
    renVM.totalVolumeBTC = renVM.totalVolumeBTC.plus(tx.amount);
    renVM.totalLockedBTC = renVM.totalLockedBTC.minus(tx.amount);
    renVM.save();

    for (let i = 0; i < periods.length; i++) {
        const dayData = getDayData(timestamp, periods[i]);

        // save info
        dayData.periodTxCountBTC = dayData.periodTxCountBTC.plus(oneBigInt());
        dayData.periodVolumeBTC = dayData.periodVolumeBTC.plus(tx.amount);
        dayData.periodLockedBTC = dayData.periodLockedBTC.minus(tx.amount);

        dayData.totalTxCountBTC = renVM.totalTxCountBTC;
        dayData.totalVolumeBTC = renVM.totalVolumeBTC;
        dayData.totalLockedBTC = renVM.totalLockedBTC;

        dayData.save();
    }

}
