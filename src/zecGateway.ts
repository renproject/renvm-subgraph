// tslint:disable: only-arrow-functions prefer-for-of

import { BigInt, Bytes } from "@graphprotocol/graph-ts";

import { Transaction } from "../generated/schema";
import { BurnCall, Gateway, MintCall } from "../generated/ZECGateway/Gateway";
import { getIntegrator, getRenVM, one } from "./common";

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

    // Update Global Values
    let renVM = getRenVM(call.block);
    renVM.totalTxCountZEC = renVM.totalTxCountZEC.plus(one());
    renVM.totalVolumeZEC = renVM.totalVolumeZEC.plus(tx.amount);
    renVM.totalLockedZEC = renVM.totalLockedZEC.plus(tx.amount);
    renVM.zecMintFee = gateway.mintFee();
    renVM.zecBurnFee = gateway.burnFee();
    renVM.save();

    if (!call.transaction.to.equals(gateway._address)) {
        if (tx.integrator !== null) {
            let integrator = getIntegrator(tx.integrator as Bytes);
            integrator.txCountZEC = integrator.txCountZEC.plus(one());
            integrator.volumeZEC = integrator.volumeZEC.plus(tx.amount);
            integrator.lockedZEC = integrator.lockedZEC.plus(tx.amount);
            integrator.save();
        }
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

    // Update Global Values
    let renVM = getRenVM(call.block);
    renVM.totalTxCountZEC = renVM.totalTxCountZEC.plus(one());
    renVM.totalVolumeZEC = renVM.totalVolumeZEC.plus(tx.amount);
    renVM.totalLockedZEC = renVM.totalLockedZEC.minus(tx.amount);
    renVM.zecMintFee = gateway.mintFee();
    renVM.zecBurnFee = gateway.burnFee();
    renVM.save();

    // Check that the burn hasn't been submitted directly by an account
    if (!call.transaction.to.equals(gateway._address)) {
        let integrator = getIntegrator(tx.integrator as Bytes);
        integrator.txCountZEC = integrator.txCountZEC.plus(one());
        integrator.volumeZEC = integrator.volumeZEC.plus(tx.amount);
        integrator.lockedZEC = integrator.lockedZEC.plus(tx.amount);
        integrator.save();
    }
}
