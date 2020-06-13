// tslint:disable: only-arrow-functions prefer-for-of

import { Address, BigInt } from "@graphprotocol/graph-ts";

import { Gateway } from "../generated/BTCGateway/Gateway";
import { DarknodePayment } from "../generated/DarknodePayment/DarknodePayment";
import {
    DarknodeRegistry, LogDarknodeDeregistered, LogDarknodeRefunded, LogDarknodeRegistered,
    LogNewEpoch,
} from "../generated/DarknodeRegistry/DarknodeRegistry";
import { Darknode, Epoch } from "../generated/schema";
import { bchGateway, btcGateway, zecGateway } from "./_config";
import { getRenVM, zero } from "./common";

export function handleLogDarknodeRegistered(event: LogDarknodeRegistered): void {
    let darknodeID = event.params._darknodeID;
    let registry = DarknodeRegistry.bind(event.address);

    let epoch = Epoch.load(registry.currentEpoch().value0.toString());
    let darknode = new Darknode(darknodeID.toHexString());
    darknode.operator = event.params._darknodeOperator;

    darknode.bond = event.params._bond;

    darknode.registeredAt = epoch.timestamp.plus(registry.minimumEpochInterval());
    darknode.deregisteredAt = zero();

    darknode.publicKey = registry.getDarknodePublicKey(darknodeID);
    darknode.save();

    let renVM = getRenVM();
    renVM.numberOfDarknodesNextEpoch = renVM.numberOfDarknodesNextEpoch.plus(new BigInt(1));
    renVM.save();
}

export function handleLogDarknodeDeregistered(event: LogDarknodeDeregistered): void {
    let id = event.params._darknodeID.toHexString();
    let registry = DarknodeRegistry.bind(event.address);
    let epoch = Epoch.load(registry.currentEpoch().value0.toString());
    let darknode = Darknode.load(id);
    if (darknode !== null) {
        darknode.operator = event.params._darknodeOperator;
        darknode.deregisteredAt = epoch.timestamp.plus(registry.minimumEpochInterval());

        darknode.save();
    }

    let renVM = getRenVM();
    renVM.numberOfDarknodesNextEpoch = renVM.numberOfDarknodesNextEpoch.minus(new BigInt(1));
    renVM.save();
}

export function handleLogDarknodeRefunded(event: LogDarknodeRefunded): void {
    let id = event.params._darknodeID.toHexString();
    let darknode = Darknode.load(id);
    if (darknode !== null) {
        darknode.deregisteredAt = zero();
        darknode.registeredAt = zero();

        darknode.save();
    }
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

    let renVM = getRenVM();
    renVM.numberOfDarknodes = epoch.numberOfDarknodes;
    renVM.numberOfDarknodesLastEpoch = epoch.numberOfDarknodesLastEpoch;
    renVM.numberOfDarknodesNextEpoch = epoch.numberOfDarknodes;
    renVM.minimumBond = epoch.minimumBond;
    renVM.minimumEpochInterval = epoch.minimumEpochInterval;
    renVM.previousEpoch = renVM.currentEpoch;
    renVM.currentEpoch = epochID;
    renVM.deregistrationInterval = registry.deregistrationInterval();
    renVM.save();

    let btcShare = !BTCGateway.try_minimumBurnAmount().reverted ? darknodePayment.previousCycleRewardShare(BTCGateway.token()) : new BigInt(0);
    epoch.rewardShareBTC = btcShare;
    epoch.totalRewardShareBTC = previousEpoch !== null ? epoch.rewardShareBTC.plus(previousEpoch.totalRewardShareBTC) : epoch.rewardShareBTC;

    let zecShare = !ZECGateway.try_minimumBurnAmount().reverted ? darknodePayment.previousCycleRewardShare(ZECGateway.token()) : new BigInt(0);
    epoch.rewardShareZEC = zecShare;
    epoch.totalRewardShareZEC = previousEpoch !== null ? epoch.rewardShareZEC.plus(previousEpoch.totalRewardShareZEC) : epoch.rewardShareZEC;

    let bchShare = !BCHGateway.try_minimumBurnAmount().reverted ? darknodePayment.previousCycleRewardShare(BCHGateway.token()) : new BigInt(0);
    epoch.rewardShareBCH = bchShare;
    epoch.totalRewardShareBCH = previousEpoch !== null ? epoch.rewardShareBCH.plus(previousEpoch.totalRewardShareBCH) : epoch.rewardShareBCH;

    epoch.save();
}
