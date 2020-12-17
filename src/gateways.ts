// tslint:disable: only-arrow-functions prefer-for-of

import { BigInt, Bytes } from "@graphprotocol/graph-ts";

import {
    BurnCall,
    Gateway,
    MintCall
} from "../generated/templates/Gateway/Gateway";
import { RenERC20 } from "../generated/templates/Gateway/RenERC20";
import { DarknodePayment } from "../generated/templates/Gateway/DarknodePayment";
import { DarknodePaymentStore } from "../generated/templates/Gateway/DarknodePaymentStore";
import { Transaction } from "../generated/schema";
import { addAmount, getAmountInUsd, subAmount } from "./utils/assetAmount";
import {
    getIntegrator,
    getIntegratorContract,
    getRenVM,
    one
} from "./utils/common";
import { addValue, setValue } from "./utils/valueWithAsset";

export function handleMint(call: MintCall): void {
    let gateway = Gateway.bind(call.to);
    let token = RenERC20.bind(gateway.token());
    let symbol = token.symbol();

    let txid = "mint_" + call.inputs._sig.toHexString();
    let tx = new Transaction(txid);

    tx.timestamp = call.block.timestamp;
    tx.asset = symbol;
    tx.amount = call.inputs._amountUnderlying;
    tx.feeRate = BigInt.fromI32(gateway.mintFee());
    tx.type = "mint";
    tx.transactionTo = call.transaction.to;
    tx.integrator = call.from;
    if (call.transaction.to.equals(gateway._address)) {
        tx.integrator = Bytes.fromUTF8("direct") as Bytes;
    }
    tx.save();

    // Update Global Values
    let renVM = getRenVM(call.block);
    renVM.txCount = addValue(renVM.txCount, renVM.id, "txCount", symbol, one());
    renVM.locked = addAmount(
        renVM.locked,
        renVM.id,
        "locked",
        symbol,
        tx.amount,
        true
    );
    renVM.volume = addAmount(
        renVM.volume,
        renVM.id,
        "volume",
        symbol,
        tx.amount,
        false
    );
    renVM.fees = addAmount(
        renVM.fees,
        renVM.id,
        "fees",
        symbol,
        tx.amount
            .times(BigInt.fromI32(gateway.mintFee()))
            .div(BigInt.fromI32(10000)),
        false
    );
    renVM.mintFee = setValue(
        renVM.mintFee,
        renVM.id,
        "mintFee",
        symbol,
        BigInt.fromI32(gateway.mintFee())
    );
    renVM.burnFee = setValue(
        renVM.burnFee,
        renVM.id,
        "burnFee",
        symbol,
        BigInt.fromI32(gateway.burnFee())
    );

    let feeRecipient = gateway.feeRecipient();
    let darknodePaymentStore = DarknodePaymentStore.bind(feeRecipient);
    let try_storeOwner = darknodePaymentStore.try_owner();
    if (!try_storeOwner.reverted) {
        let darknodePayment = DarknodePayment.bind(try_storeOwner.value);
        let try_rewardPool = darknodePayment.try_currentCycleRewardPool(
            token._address
        );
        if (!try_rewardPool.reverted) {
            renVM.cycleFees = setValue(
                renVM.cycleFees,
                renVM.id,
                "cycleFees",
                symbol,
                try_rewardPool.value
            );
        }
    }

    renVM.save();

    if (tx.integrator !== null) {
        let integrator = getIntegrator(tx.integrator as Bytes);

        // TxCount
        integrator.txCount = addValue(
            integrator.txCount,
            integrator.id,
            "txCount",
            symbol,
            one()
        );
        integrator.txCountTotal = integrator.txCountTotal.plus(one());

        // Locked
        integrator.locked = addAmount(
            integrator.locked,
            integrator.id,
            "locked",
            symbol,
            tx.amount,
            true
        );

        // Volume
        let volumeBefore = getAmountInUsd(integrator.id, "volume", symbol);
        integrator.volume = addAmount(
            integrator.volume,
            integrator.id,
            "volume",
            symbol,
            tx.amount,
            false
        );
        let volumeAfter = getAmountInUsd(integrator.id, "volume", symbol);
        // Add difference of volumeAfter and volumeBefore.
        integrator.volumeTotalUSD = integrator.volumeTotalUSD
            .plus(volumeAfter)
            .minus(volumeBefore);

        // Fees
        let feesBefore = getAmountInUsd(integrator.id, "fees", symbol);
        integrator.fees = addAmount(
            integrator.fees,
            integrator.id,
            "fees",
            symbol,
            tx.amount
                .times(BigInt.fromI32(gateway.mintFee()))
                .div(BigInt.fromI32(10000)),
            false
        );
        let feesAfter = getAmountInUsd(integrator.id, "fees", symbol);
        // Add difference of feesAfter and feesBefore.
        integrator.feesTotalUSD = integrator.feesTotalUSD
            .plus(feesAfter)
            .minus(feesBefore);

        integrator.save();

        let integratorContract = getIntegratorContract(tx.integrator as Bytes);
        integratorContract.txCount = addValue(
            integratorContract.txCount,
            integratorContract.id,
            "txCount",
            symbol,
            one()
        );
        integratorContract.locked = addAmount(
            integratorContract.locked,
            integratorContract.id,
            "locked",
            symbol,
            tx.amount,
            true
        );
        integratorContract.volume = addAmount(
            integratorContract.volume,
            integratorContract.id,
            "volume",
            symbol,
            tx.amount,
            false
        );
        integratorContract.fees = addAmount(
            integratorContract.fees,
            integratorContract.id,
            "fees",
            symbol,
            tx.amount
                .times(BigInt.fromI32(gateway.mintFee()))
                .div(BigInt.fromI32(10000)),
            false
        );
        integratorContract.save();
    }
}

export function handleBurn(call: BurnCall): void {
    let gateway = Gateway.bind(call.to);
    let token = RenERC20.bind(gateway.token());
    let symbol = token.symbol();

    let txid =
        "burn_" +
        gateway.nextN().toString() +
        "_" +
        call.inputs._to.toHexString() +
        "_" +
        call.inputs._amount.toString();
    let tx = new Transaction(txid);

    tx.timestamp = call.block.timestamp;
    tx.asset = symbol;
    tx.amount = call.inputs._amount;
    tx.feeRate = BigInt.fromI32(gateway.burnFee());
    tx.type = "burn";
    tx.integrator = call.from;
    if (call.transaction.to.equals(gateway._address)) {
        tx.integrator = Bytes.fromUTF8("direct") as Bytes;
    }
    tx.transactionTo = call.transaction.to;
    tx.burnRecipient = call.inputs._to;
    tx.save();

    // Update Global Values
    let renVM = getRenVM(call.block);
    renVM.txCount = addValue(renVM.txCount, renVM.id, "txCount", symbol, one());
    renVM.locked = subAmount(
        renVM.locked,
        renVM.id,
        "locked",
        symbol,
        tx.amount.minus(
            tx.amount
                .times(BigInt.fromI32(gateway.burnFee()))
                .div(BigInt.fromI32(10000))
        ),
        true
    );
    renVM.volume = addAmount(
        renVM.volume,
        renVM.id,
        "volume",
        symbol,
        tx.amount,
        false
    );
    renVM.fees = addAmount(
        renVM.fees,
        renVM.id,
        "fees",
        symbol,
        tx.amount
            .times(BigInt.fromI32(gateway.burnFee()))
            .div(BigInt.fromI32(10000)),
        false
    );
    renVM.mintFee = setValue(
        renVM.mintFee,
        renVM.id,
        "mintFee",
        symbol,
        BigInt.fromI32(gateway.mintFee())
    );
    renVM.burnFee = setValue(
        renVM.burnFee,
        renVM.id,
        "burnFee",
        symbol,
        BigInt.fromI32(gateway.burnFee())
    );

    let feeRecipient = gateway.feeRecipient();
    let darknodePaymentStore = DarknodePaymentStore.bind(feeRecipient);
    let try_storeOwner = darknodePaymentStore.try_owner();
    if (!try_storeOwner.reverted) {
        let darknodePayment = DarknodePayment.bind(try_storeOwner.value);
        let try_rewardPool = darknodePayment.try_currentCycleRewardPool(
            token._address
        );
        if (!try_rewardPool.reverted) {
            renVM.cycleFees = setValue(
                renVM.cycleFees,
                renVM.id,
                "cycleFees",
                symbol,
                try_rewardPool.value
            );
        }
    }

    renVM.save();

    // Integrator

    let integrator = getIntegrator(tx.integrator as Bytes);

    // TxCount
    integrator.txCount = addValue(
        integrator.txCount,
        integrator.id,
        "txCount",
        symbol,
        one()
    );
    integrator.txCountTotal = integrator.txCountTotal.plus(one());

    // Locked
    integrator.locked = subAmount(
        integrator.locked,
        integrator.id,
        "locked",
        symbol,
        tx.amount.minus(
            tx.amount
                .times(BigInt.fromI32(gateway.burnFee()))
                .div(BigInt.fromI32(10000))
        ),
        true
    );

    // Volume
    let volumeBefore = getAmountInUsd(integrator.id, "volume", symbol);
    integrator.volume = addAmount(
        integrator.volume,
        integrator.id,
        "volume",
        symbol,
        tx.amount,
        false
    );
    let volumeAfter = getAmountInUsd(integrator.id, "volume", symbol);
    // Add difference of volumeAfter and volumeBefore.
    integrator.volumeTotalUSD = integrator.volumeTotalUSD
        .plus(volumeAfter)
        .minus(volumeBefore);

    // Fees
    let feesBefore = getAmountInUsd(integrator.id, "fees", symbol);
    integrator.fees = addAmount(
        integrator.fees,
        integrator.id,
        "fees",
        symbol,
        tx.amount
            .times(BigInt.fromI32(gateway.burnFee()))
            .div(BigInt.fromI32(10000)),
        false
    );
    let feesAfter = getAmountInUsd(integrator.id, "fees", symbol);
    // Add difference of feesAfter and feesBefore.
    integrator.feesTotalUSD = integrator.feesTotalUSD
        .plus(feesAfter)
        .minus(feesBefore);

    integrator.save();

    // Integrator contract

    let integratorContract = getIntegratorContract(tx.integrator as Bytes);

    // TxCount
    integratorContract.txCount = addValue(
        integratorContract.txCount,
        integratorContract.id,
        "txCount",
        symbol,
        one()
    );

    // Locked
    integratorContract.locked = subAmount(
        integratorContract.locked,
        integratorContract.id,
        "locked",
        symbol,
        tx.amount.minus(
            tx.amount
                .times(BigInt.fromI32(gateway.burnFee()))
                .div(BigInt.fromI32(10000))
        ),
        true
    );

    // Volume
    integratorContract.volume = addAmount(
        integratorContract.volume,
        integratorContract.id,
        "volume",
        symbol,
        tx.amount,
        false
    );

    // Fees
    integratorContract.fees = addAmount(
        integratorContract.fees,
        integratorContract.id,
        "fees",
        symbol,
        tx.amount
            .times(BigInt.fromI32(gateway.burnFee()))
            .div(BigInt.fromI32(10000)),
        false
    );
    integratorContract.save();
}
