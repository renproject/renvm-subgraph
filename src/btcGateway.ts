// tslint:disable: only-arrow-functions prefer-for-of

import { BigInt, Bytes } from "@graphprotocol/graph-ts";

import { Gateway, LogBurn, LogMint } from "../generated/BTCGateway/Gateway";
import { Integrator, Transaction } from "../generated/schema";
import { getDayData, getIntegrator, getRenVM, I32, one, zero } from "./common";

const periods: string[] = ["HOUR", "DAY", "WEEK", "MONTH", "YEAR"];

export function handleLogMint(event: LogMint): void {

    const txid = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
    const tx = new Transaction(txid);

    const gateway = Gateway.bind(event.address);

    tx.createdTimestamp = event.block.timestamp;
    tx.asset = "BTC";
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
    renVM.totalTxCountBTC = renVM.totalTxCountBTC.plus(one());
    renVM.totalVolumeBTC = renVM.totalVolumeBTC.plus(tx.amount);
    renVM.totalLockedBTC = renVM.totalLockedBTC.plus(tx.amount);
    renVM.save();

    if (!event.transaction.to.equals(gateway._address)) {
        if (tx.integrator !== null) {

            const integrator24H: Integrator = getIntegrator(tx.integrator as Bytes, timestamp);
            integrator24H.txCountBTC = integrator24H.txCountBTC.plus(one());
            integrator24H.volumeBTC = integrator24H.volumeBTC.plus(tx.amount);
            integrator24H.lockedBTC = integrator24H.lockedBTC.plus(tx.amount);
            integrator24H.save();

            const integrator = getIntegrator(tx.integrator as Bytes, 0);
            integrator.txCountBTC = integrator.txCountBTC.plus(one());
            integrator.volumeBTC = integrator.volumeBTC.plus(tx.amount);
            integrator.lockedBTC = integrator.lockedBTC.plus(tx.amount);
            integrator.integrator24H = integrator24H.id;
            integrator.save();
        }
    }

    for (let i = 0; i < periods.length; i++) {
        const dayData = getDayData(timestamp, periods[i]);

        // save info
        dayData.periodTxCountBTC = dayData.periodTxCountBTC.plus(one());
        dayData.periodVolumeBTC = dayData.periodVolumeBTC.plus(tx.amount);
        dayData.periodLockedBTC = dayData.periodLockedBTC.plus(tx.amount);

        dayData.totalTxCountBTC = renVM.totalTxCountBTC;
        dayData.totalVolumeBTC = renVM.totalVolumeBTC;
        dayData.totalLockedBTC = renVM.totalLockedBTC;

        dayData.save();
    }
}

export function handleLogBurn(event: LogBurn): void {
    const txid = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
    const tx = new Transaction(txid);

    const contract = Gateway.bind(event.address);

    tx.createdTimestamp = event.block.timestamp;
    tx.asset = "BTC";
    tx.amount = event.params._amount;
    tx.feeRate = BigInt.fromI32(contract.burnFee());
    tx.type = "burn";
    tx.integrator = event.transaction.from;
    tx.transactionTo = event.transaction.to;
    tx.save();

    // Nov 2 2018 is 1541116800 for dayStartTimestamp and 17837 for dayID
    // Nov 3 2018 would be 1541116800 + 86400 and 17838. And so on, for each exchange
    const timestamp: I32 = event.block.timestamp.toI32();

    // Update Global Values
    const renVM = getRenVM();
    renVM.totalTxCountBTC = renVM.totalTxCountBTC.plus(one());
    renVM.totalVolumeBTC = renVM.totalVolumeBTC.plus(tx.amount);
    renVM.totalLockedBTC = renVM.totalLockedBTC.minus(tx.amount);
    renVM.save();


    // The integrator isn't available from the event, and the `to` address
    // might be another contract, like a multisig.
    // If the `to` address has already been marked as an integrator, add the 
    // values. This will miss a few different cases, so a better solution should
    // be implemented.
    const integrator = getIntegrator(tx.integrator as Bytes, 0);
    if (integrator.txCountBTC.gt(zero()) || integrator.txCountZEC.gt(zero()) || integrator.txCountBCH.gt(zero())) {
        const integrator24H: Integrator = getIntegrator(tx.integrator as Bytes, timestamp);
        integrator24H.txCountBTC = integrator24H.txCountBTC.plus(one());
        integrator24H.volumeBTC = integrator24H.volumeBTC.plus(tx.amount);
        integrator24H.lockedBTC = integrator24H.lockedBTC.plus(tx.amount);
        integrator24H.save();

        integrator.txCountBTC = integrator.txCountBTC.plus(one());
        integrator.volumeBTC = integrator.volumeBTC.plus(tx.amount);
        integrator.lockedBTC = integrator.lockedBTC.plus(tx.amount);
        integrator.integrator24H = integrator24H.id;
        integrator.save();
    }

    for (let i = 0; i < periods.length; i++) {
        const dayData = getDayData(timestamp, periods[i]);

        // save info
        dayData.periodTxCountBTC = dayData.periodTxCountBTC.plus(one());
        dayData.periodVolumeBTC = dayData.periodVolumeBTC.plus(tx.amount);
        dayData.periodLockedBTC = dayData.periodLockedBTC.minus(tx.amount);

        dayData.totalTxCountBTC = renVM.totalTxCountBTC;
        dayData.totalVolumeBTC = renVM.totalVolumeBTC;
        dayData.totalLockedBTC = renVM.totalLockedBTC;

        dayData.save();
    }

}
