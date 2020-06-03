// tslint:disable: only-arrow-functions prefer-for-of

import { BigInt, Bytes } from "@graphprotocol/graph-ts";

import { Gateway } from "../generated/BTCGateway/Gateway";
import { Integrator, Transaction } from "../generated/schema";
import { BurnCall, MintCall } from "../generated/ZECGateway/Gateway";
import { getDayData, getIntegrator, getRenVM, I32, one, zero } from "./common";

const periods: string[] = ["HOUR", "DAY", "WEEK", "MONTH", "YEAR"];

export function handleMint(call: MintCall): void {
    let gateway = Gateway.bind(call.to);

    let txid = "mint_" + call.inputs._sig.toHexString();
    let tx = new Transaction(txid);

    tx.createdTimestamp = call.block.timestamp;
    tx.asset = "BTC";
    tx.amount = call.inputs._amountUnderlying;
    tx.feeRate = BigInt.fromI32(gateway.mintFee());
    tx.type = "mint";
    tx.transactionTo = call.transaction.to;
    tx.integrator = call.from;
    tx.save();

    // Nov 2 2018 is 1541116800 for dayStartTimestamp and 17837 for dayID
    // Nov 3 2018 would be 1541116800 + 86400 and 17838. And so on, for each exchange
    let timestamp: I32 = call.block.timestamp.toI32();

    // Update Global Values
    let renVM = getRenVM();
    renVM.totalTxCountBTC = renVM.totalTxCountBTC.plus(one());
    renVM.totalVolumeBTC = renVM.totalVolumeBTC.plus(tx.amount);
    renVM.totalLockedBTC = renVM.totalLockedBTC.plus(tx.amount);
    renVM.save();

    // Check that the mint hasn't been submitted directly by an account
    if (!call.transaction.to.equals(gateway._address)) {
        if (tx.integrator !== null) {

            let integrator24H: Integrator = getIntegrator(tx.integrator as Bytes, timestamp);
            integrator24H.txCountBTC = integrator24H.txCountBTC.plus(one());
            integrator24H.volumeBTC = integrator24H.volumeBTC.plus(tx.amount);
            integrator24H.lockedBTC = integrator24H.lockedBTC.plus(tx.amount);
            integrator24H.save();

            let integrator = getIntegrator(tx.integrator as Bytes, 0);
            integrator.txCountBTC = integrator.txCountBTC.plus(one());
            integrator.volumeBTC = integrator.volumeBTC.plus(tx.amount);
            integrator.lockedBTC = integrator.lockedBTC.plus(tx.amount);
            integrator.integrator24H = integrator24H.id;
            integrator.save();
        }
    }

    for (let i = 0; i < periods.length; i++) {
        let dayData = getDayData(timestamp, periods[i]);

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

export function handleBurn(call: BurnCall): void {
    let gateway = Gateway.bind(call.to);

    let txid = "burn_" + gateway.nextN().toString() + "_" + call.inputs._to.toHexString() + "_" + call.inputs._amount.toString();
    let tx = new Transaction(txid);

    tx.createdTimestamp = call.block.timestamp;
    tx.asset = "BTC";
    tx.amount = call.inputs._amount;
    tx.feeRate = BigInt.fromI32(gateway.burnFee());
    tx.type = "burn";
    tx.integrator = call.from;
    tx.transactionTo = call.transaction.to;
    tx.burnRecipient = call.inputs._to;
    tx.save();

    // Nov 2 2018 is 1541116800 for dayStartTimestamp and 17837 for dayID
    // Nov 3 2018 would be 1541116800 + 86400 and 17838. And so on, for each exchange
    let timestamp: I32 = call.block.timestamp.toI32();

    // Update Global Values
    let renVM = getRenVM();
    renVM.totalTxCountBTC = renVM.totalTxCountBTC.plus(one());
    renVM.totalVolumeBTC = renVM.totalVolumeBTC.plus(tx.amount);
    renVM.totalLockedBTC = renVM.totalLockedBTC.minus(tx.amount);
    renVM.save();


    // Check that the burn hasn't been submitted directly by an account
    if (!call.transaction.to.equals(gateway._address)) {
        let integrator = getIntegrator(tx.integrator as Bytes, 0);
        let integrator24H: Integrator = getIntegrator(tx.integrator as Bytes, timestamp);
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
        let dayData = getDayData(timestamp, periods[i]);

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
