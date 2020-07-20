// tslint:disable: only-arrow-functions prefer-for-of

import { BigInt, Bytes } from "@graphprotocol/graph-ts";

import { Gateway } from "../generated/BTCGateway/Gateway";
import { Transaction } from "../generated/schema";
import { BurnCall, MintCall } from "../generated/ZECGateway/Gateway";
import { getIntegrator, getIntegratorContract, getRenVM, one } from "./common";

export function handleMint(call: MintCall): void {
    let gateway = Gateway.bind(call.to);

    let txid = "mint_" + call.inputs._sig.toHexString();
    let tx = new Transaction(txid);

    tx.timestamp = call.block.timestamp;
    tx.asset = "BTC";
    tx.amount = call.inputs._amountUnderlying;
    tx.feeRate = BigInt.fromI32(gateway.mintFee());
    tx.type = "mint";
    tx.transactionTo = call.transaction.to;
    tx.integrator = call.from;
    tx.save();

    // Update Global Values
    let renVM = getRenVM(call.block);
    renVM.totalTxCountBTC = renVM.totalTxCountBTC.plus(one());
    renVM.totalVolumeBTC = renVM.totalVolumeBTC.plus(tx.amount);
    renVM.totalLockedBTC = renVM.totalLockedBTC.plus(tx.amount);
    renVM.btcMintFee = gateway.mintFee();
    renVM.btcBurnFee = gateway.burnFee();
    renVM.save();

    // Check that the mint hasn't been submitted directly by an account
    if (!call.transaction.to.equals(gateway._address)) {
        if (tx.integrator !== null) {
            let integrator = getIntegrator(tx.integrator as Bytes);
            integrator.txCountBTC = integrator.txCountBTC.plus(one());
            integrator.volumeBTC = integrator.volumeBTC.plus(tx.amount);
            integrator.lockedBTC = integrator.lockedBTC.plus(tx.amount);
            integrator.save();

            let integratorContract = getIntegratorContract(tx.integrator as Bytes);
            integratorContract.txCountBTC = integratorContract.txCountBTC.plus(one());
            integratorContract.volumeBTC = integratorContract.volumeBTC.plus(tx.amount);
            integratorContract.lockedBTC = integratorContract.lockedBTC.plus(tx.amount);
            integratorContract.save();
        }
    }
}

export function handleBurn(call: BurnCall): void {
    let gateway = Gateway.bind(call.to);

    let txid = "burn_" + gateway.nextN().toString() + "_" + call.inputs._to.toHexString() + "_" + call.inputs._amount.toString();
    let tx = new Transaction(txid);

    tx.timestamp = call.block.timestamp;
    tx.asset = "BTC";
    tx.amount = call.inputs._amount;
    tx.feeRate = BigInt.fromI32(gateway.burnFee());
    tx.type = "burn";
    tx.integrator = call.from;
    tx.transactionTo = call.transaction.to;
    tx.burnRecipient = call.inputs._to;
    tx.save();

    // Update Global Values
    let renVM = getRenVM(call.block);
    renVM.totalTxCountBTC = renVM.totalTxCountBTC.plus(one());
    renVM.totalVolumeBTC = renVM.totalVolumeBTC.plus(tx.amount);
    renVM.totalLockedBTC = renVM.totalLockedBTC.minus(tx.amount);
    renVM.btcMintFee = gateway.mintFee();
    renVM.btcBurnFee = gateway.burnFee();
    renVM.save();

    // Check that the burn hasn't been submitted directly by an account
    if (!call.transaction.to.equals(gateway._address)) {
        let integrator = getIntegrator(tx.integrator as Bytes);
        integrator.txCountBTC = integrator.txCountBTC.plus(one());
        integrator.volumeBTC = integrator.volumeBTC.plus(tx.amount);
        integrator.lockedBTC = integrator.lockedBTC.plus(tx.amount);
        integrator.save();

        let integratorContract = getIntegratorContract(tx.integrator as Bytes);
        integratorContract.txCountBTC = integratorContract.txCountBTC.plus(one());
        integratorContract.volumeBTC = integratorContract.volumeBTC.plus(tx.amount);
        integratorContract.lockedBTC = integratorContract.lockedBTC.plus(tx.amount);
        integratorContract.save();
    }
}
