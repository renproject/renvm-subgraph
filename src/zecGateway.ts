// tslint:disable: only-arrow-functions prefer-for-of

import { BigInt, Bytes } from "@graphprotocol/graph-ts";

import { Integrator, Transaction } from "../generated/schema";
import { BurnCall, Gateway, MintCall } from "../generated/ZECGateway/Gateway";
import { getDayData, getIntegrator, getRenVM, I32, one, zero } from "./common";

const periods: string[] = ["HOUR", "DAY", "WEEK", "MONTH", "YEAR"];

export function handleMint(call: MintCall): void {
    let gateway = Gateway.bind(call.to);

    let txid = "mint_" + call.inputs._sig.toHexString();
    let tx = new Transaction(txid);

    tx.timestamp = call.block.timestamp;
    tx.asset = "ZEC";
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
    renVM.totalTxCountZEC = renVM.totalTxCountZEC.plus(one());
    renVM.totalVolumeZEC = renVM.totalVolumeZEC.plus(tx.amount);
    renVM.totalLockedZEC = renVM.totalLockedZEC.plus(tx.amount);
    renVM.save();

    if (!call.transaction.to.equals(gateway._address)) {
        if (tx.integrator !== null) {

            let integrator24H: Integrator = getIntegrator(tx.integrator as Bytes, timestamp);
            integrator24H.txCountZEC = integrator24H.txCountZEC.plus(one());
            integrator24H.volumeZEC = integrator24H.volumeZEC.plus(tx.amount);
            integrator24H.lockedZEC = integrator24H.lockedZEC.plus(tx.amount);
            integrator24H.save();

            let integrator = getIntegrator(tx.integrator as Bytes, 0);
            integrator.txCountZEC = integrator.txCountZEC.plus(one());
            integrator.volumeZEC = integrator.volumeZEC.plus(tx.amount);
            integrator.lockedZEC = integrator.lockedZEC.plus(tx.amount);
            integrator.integrator24H = integrator24H.id;
            integrator.save();
        }
    }

    for (let i = 0; i < periods.length; i++) {
        let dayData = getDayData(timestamp, periods[i]);

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

export function handleBurn(call: BurnCall): void {
    let gateway = Gateway.bind(call.to);

    let txid = "burn_" + gateway.nextN().toString() + "_" + call.inputs._to.toHexString() + "_" + call.inputs._amount.toString();
    let tx = new Transaction(txid);

    tx.timestamp = call.block.timestamp;
    tx.asset = "ZEC";
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
    renVM.totalTxCountZEC = renVM.totalTxCountZEC.plus(one());
    renVM.totalVolumeZEC = renVM.totalVolumeZEC.plus(tx.amount);
    renVM.totalLockedZEC = renVM.totalLockedZEC.minus(tx.amount);
    renVM.save();


    // Check that the burn hasn't been submitted directly by an account
    if (!call.transaction.to.equals(gateway._address)) {
        let integrator = getIntegrator(tx.integrator as Bytes, 0);
        let integrator24H: Integrator = getIntegrator(tx.integrator as Bytes, timestamp);
        integrator24H.txCountZEC = integrator24H.txCountZEC.plus(one());
        integrator24H.volumeZEC = integrator24H.volumeZEC.plus(tx.amount);
        integrator24H.lockedZEC = integrator24H.lockedZEC.plus(tx.amount);
        integrator24H.save();

        integrator.txCountZEC = integrator.txCountZEC.plus(one());
        integrator.volumeZEC = integrator.volumeZEC.plus(tx.amount);
        integrator.lockedZEC = integrator.lockedZEC.plus(tx.amount);
        integrator.integrator24H = integrator24H.id;
        integrator.save();
    }

    for (let i = 0; i < periods.length; i++) {
        let dayData = getDayData(timestamp, periods[i]);

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
