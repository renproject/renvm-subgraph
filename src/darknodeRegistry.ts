// tslint:disable: only-arrow-functions prefer-for-of

import { Address, BigInt } from "@graphprotocol/graph-ts";

import { Gateway } from "../generated/BTCGateway/Gateway";
import { DarknodePayment } from "../generated/DarknodePayment/DarknodePayment";
import {
    DarknodeRegistry, LogDarknodeDeregistered, LogDarknodeRefunded, LogDarknodeRegistered,
    LogNewEpoch,
} from "../generated/DarknodeRegistry/DarknodeRegistry";
import { Epoch } from "../generated/schema";
import { bchGateway, btcGateway, zecGateway } from "./_config";
import { getDarknode, getRenVM, zero } from "./common";

export function handleLogDarknodeRegistered(event: LogDarknodeRegistered): void {
    let darknodeID = event.params._darknodeID;
    let registry = DarknodeRegistry.bind(event.address);

    let epoch = Epoch.load(registry.currentEpoch().value0.toString());
    let darknode = getDarknode(darknodeID);
    darknode.operator = event.params._darknodeOperator;

    darknode.bond = event.params._bond;

    darknode.registeredAt = epoch.timestamp.plus(registry.minimumEpochInterval());
    darknode.deregisteredAt = zero();

    darknode.publicKey = registry.getDarknodePublicKey(darknodeID);
    darknode.save();

    let renVM = getRenVM(event.block);
    renVM.numberOfDarknodesNextEpoch = registry.numDarknodesNextEpoch();
    renVM.save();
}

export function handleLogDarknodeDeregistered(event: LogDarknodeDeregistered): void {
    let registry = DarknodeRegistry.bind(event.address);
    let epoch = Epoch.load(registry.currentEpoch().value0.toString());
    let darknode = getDarknode(event.params._darknodeID);
    if (darknode !== null) {
        darknode.operator = event.params._darknodeOperator;
        darknode.deregisteredAt = epoch.timestamp.plus(registry.minimumEpochInterval());

        darknode.save();
    }

    let renVM = getRenVM(event.block);
    renVM.numberOfDarknodesNextEpoch = registry.numDarknodesNextEpoch();
    renVM.save();
}

export function handleLogDarknodeRefunded(event: LogDarknodeRefunded): void {
    let darknode = getDarknode(event.params._darknodeID);
    if (darknode !== null) {
        darknode.deregisteredAt = zero();
        darknode.registeredAt = zero();

        darknode.save();
    }

    // Update RenVM's latest active block.
    getRenVM(event.block);
}

export function handleLogNewEpoch(event: LogNewEpoch): void {
    let epochID = event.params.epochhash.toString();
    let registry = DarknodeRegistry.bind(event.address);

    let BTCGateway = Gateway.bind(Address.fromString(btcGateway.slice(2)));
    let ZECGateway = Gateway.bind(Address.fromString(zecGateway.slice(2)));
    let BCHGateway = Gateway.bind(Address.fromString(bchGateway.slice(2)));

    let darknodePayment = DarknodePayment.bind(registry.darknodePayment());

    let previousEpochID = (registry.previousEpoch()).value0.toString();

    let previousEpoch = Epoch.load(previousEpochID);

    let epoch = new Epoch(epochID);
    epoch.timestamp = event.block.timestamp;
    epoch.epochhash = event.params.epochhash;
    epoch.blockNumber = event.block.number;
    epoch.nextEpochBlockNumber = event.block.number.plus(registry.nextMinimumEpochInterval());

    epoch.numberOfDarknodes = registry.numDarknodes();
    epoch.numberOfDarknodesLastEpoch = registry.numDarknodesPreviousEpoch();

    epoch.minimumBond = registry.minimumBond();
    epoch.minimumEpochInterval = registry.minimumEpochInterval();

    let renVM = getRenVM(event.block);
    renVM.numberOfDarknodes = epoch.numberOfDarknodes;
    renVM.numberOfDarknodesLastEpoch = epoch.numberOfDarknodesLastEpoch;
    renVM.numberOfDarknodesNextEpoch = registry.numDarknodesNextEpoch();
    renVM.minimumBond = epoch.minimumBond;
    renVM.minimumEpochInterval = epoch.minimumEpochInterval;
    renVM.previousEpoch = renVM.currentEpoch;
    renVM.currentEpoch = epochID;
    renVM.deregistrationInterval = registry.deregistrationInterval();

    renVM.btcMintFee = !BTCGateway.try_mintFee().reverted ? BTCGateway.mintFee() : zero();
    renVM.btcBurnFee = !BTCGateway.try_burnFee().reverted ? BTCGateway.burnFee() : zero();
    renVM.zecMintFee = !ZECGateway.try_mintFee().reverted ? ZECGateway.mintFee() : zero();
    renVM.zecBurnFee = !ZECGateway.try_burnFee().reverted ? ZECGateway.burnFee() : zero();
    renVM.bchMintFee = !BCHGateway.try_mintFee().reverted ? BCHGateway.mintFee() : zero();
    renVM.bchBurnFee = !BCHGateway.try_burnFee().reverted ? BCHGateway.burnFee() : zero();

    renVM.save();

    let btcShare = !BTCGateway.try_minimumBurnAmount().reverted ? darknodePayment.previousCycleRewardShare(BTCGateway.token()) : zero();
    epoch.rewardShareBTC = btcShare;
    epoch.totalRewardShareBTC = previousEpoch !== null ? epoch.rewardShareBTC.plus(previousEpoch.totalRewardShareBTC) : epoch.rewardShareBTC;

    let zecShare = !ZECGateway.try_minimumBurnAmount().reverted ? darknodePayment.previousCycleRewardShare(ZECGateway.token()) : zero();
    epoch.rewardShareZEC = zecShare;
    epoch.totalRewardShareZEC = previousEpoch !== null ? epoch.rewardShareZEC.plus(previousEpoch.totalRewardShareZEC) : epoch.rewardShareZEC;

    let bchShare = !BCHGateway.try_minimumBurnAmount().reverted ? darknodePayment.previousCycleRewardShare(BCHGateway.token()) : zero();
    epoch.rewardShareBCH = bchShare;
    epoch.totalRewardShareBCH = previousEpoch !== null ? epoch.rewardShareBCH.plus(previousEpoch.totalRewardShareBCH) : epoch.rewardShareBCH;

    epoch.save();
}
