// tslint:disable: only-arrow-functions prefer-for-of

import { Address, BigInt } from "@graphprotocol/graph-ts";

import { Gateway } from "../generated/BTCGateway/Gateway";
import { DarknodePayment } from "../generated/DarknodePayment/DarknodePayment";
import {
    DarknodeRegistry, LogDarknodeDeregistered, LogDarknodeRegistered, LogNewEpoch,
} from "../generated/DarknodeRegistry/DarknodeRegistry";
import { Darknode, Epoch } from "../generated/schema";
import { bchGateway, btcGateway, zecGateway } from "./_config";

export function handleLogDarknodeRegistered(event: LogDarknodeRegistered): void {
    let id = event.params._darknodeID.toHexString();
    let registry = DarknodeRegistry.bind(event.address);

    let epoch = Epoch.load(registry.currentEpoch().value0.toString());
    let darknode = new Darknode(id);
    darknode.operator = event.params._darknodeOperator;
    darknode.isRegistered = true;
    // if (event.block.timestamp) {
    darknode.registeredTimestamp = event.block.timestamp;
    // }
    if (epoch !== null) {
        darknode.startBlock = epoch.nextEpochBlockNumber;
    }
    darknode.save();
}

export function handleLogDarknodeDeregistered(event: LogDarknodeDeregistered): void {
    let id = event.params._darknodeID.toHexString();
    let registry = DarknodeRegistry.bind(event.address);
    let epoch = Epoch.load(registry.currentEpoch().value0.toString());
    let darknode = Darknode.load(id);
    if (darknode !== null) {
        darknode.operator = event.params._darknodeOperator;
        darknode.isRegistered = false;
        // if (event.block.timestamp) {
        darknode.deregisteredTimestamp = event.block.timestamp;
        // }
        if (epoch !== null) {
            darknode.endBlock = epoch.nextEpochBlockNumber;
        }
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
    epoch.createdTimestamp = event.block.timestamp;
    epoch.blockNumber = event.block.number;
    epoch.nextEpochBlockNumber = event.block.number.plus(registry.nextMinimumEpochInterval());

    epoch.numberOfDarknodes = registry.numDarknodes();
    epoch.numberOfDarknodesLastEpoch = registry.numDarknodesPreviousEpoch();
    epoch.numberOfDarknodesNextEpoch = registry.numDarknodesNextEpoch();

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
