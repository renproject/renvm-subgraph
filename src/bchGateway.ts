// tslint:disable: only-arrow-functions prefer-for-of

import { BigInt, Bytes } from "@graphprotocol/graph-ts";

import { BurnCall, Gateway, MintCall } from "../generated/BCHGateway/Gateway";
import { Integrator, Transaction } from "../generated/schema";
import {
    getIntegrator,
    getIntegratorContract,
    getRenVM,
    one
} from "./utils/common";

export function handleMint(call: MintCall): void {
    let gateway = Gateway.bind(call.to);

    let txid = "mint_" + call.inputs._sig.toHexString();
    let tx = new Transaction(txid);

    tx.timestamp = call.block.timestamp;
    tx.asset = "BCH";
    tx.amount = call.inputs._amountUnderlying;
    tx.feeRate = BigInt.fromI32(gateway.mintFee());
    tx.type = "mint";
    tx.transactionTo = call.transaction.to;
    tx.integrator = call.from;
    tx.save();

    // Update Global Values
    let renVM = getRenVM(call.block);
    renVM.totalTxCountBCH = renVM.totalTxCountBCH.plus(one());
    renVM.totalVolumeBCH = renVM.totalVolumeBCH.plus(tx.amount);
    renVM.totalLockedBCH = renVM.totalLockedBCH.plus(tx.amount);
    renVM.bchMintFee = gateway.mintFee();
    renVM.bchBurnFee = gateway.burnFee();
    renVM.save();

    if (!call.transaction.to.equals(gateway._address)) {
        if (tx.integrator !== null) {
            let integrator: Integrator = getIntegrator(tx.integrator as Bytes);
            integrator.txCountBCH = integrator.txCountBCH.plus(one());
            integrator.volumeBCH = integrator.volumeBCH.plus(tx.amount);
            integrator.lockedBCH = integrator.lockedBCH.plus(tx.amount);
            integrator.save();

            let integratorContract = getIntegratorContract(
                tx.integrator as Bytes
            );
            integratorContract.txCountBCH = integratorContract.txCountBCH.plus(
                one()
            );
            integratorContract.volumeBCH = integratorContract.volumeBCH.plus(
                tx.amount
            );
            integratorContract.lockedBCH = integratorContract.lockedBCH.plus(
                tx.amount
            );
            integratorContract.save();
        }
    }
}

export function handleBurn(call: BurnCall): void {
    let gateway = Gateway.bind(call.to);

    let txid =
        "burn_" +
        gateway.nextN().toString() +
        "_" +
        call.inputs._to.toHexString() +
        "_" +
        call.inputs._amount.toString();
    let tx = new Transaction(txid);

    tx.timestamp = call.block.timestamp;
    tx.asset = "BCH";
    tx.amount = call.inputs._amount;
    tx.feeRate = BigInt.fromI32(gateway.burnFee());
    tx.type = "burn";
    tx.integrator = call.from;
    tx.transactionTo = call.transaction.to;
    tx.burnRecipient = call.inputs._to;
    tx.save();

    // Update Global Values
    let renVM = getRenVM(call.block);
    renVM.totalTxCountBCH = renVM.totalTxCountBCH.plus(one());
    renVM.totalVolumeBCH = renVM.totalVolumeBCH.plus(tx.amount);
    renVM.totalLockedBCH = renVM.totalLockedBCH.minus(tx.amount);
    renVM.bchMintFee = gateway.mintFee();
    renVM.bchBurnFee = gateway.burnFee();
    renVM.save();

    // Check that the burn hasn't been submitted directly by an account
    if (!call.transaction.to.equals(gateway._address)) {
        let integrator: Integrator = getIntegrator(tx.integrator as Bytes);
        integrator.txCountBCH = integrator.txCountBCH.plus(one());
        integrator.volumeBCH = integrator.volumeBCH.plus(tx.amount);
        integrator.lockedBCH = integrator.lockedBCH.plus(tx.amount);
        integrator.save();

        let integratorContract = getIntegratorContract(tx.integrator as Bytes);
        integratorContract.txCountBCH = integratorContract.txCountBCH.plus(
            one()
        );
        integratorContract.volumeBCH = integratorContract.volumeBCH.plus(
            tx.amount
        );
        integratorContract.lockedBCH = integratorContract.lockedBCH.plus(
            tx.amount
        );
        integratorContract.save();
    }
}
