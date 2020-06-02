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
    const id = event.params._darknodeID.toHexString();
    const registry = DarknodeRegistry.bind(event.address);

    const epoch = Epoch.load(registry.currentEpoch().value0.toString());
    const darknode = new Darknode(id);
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
    const id = event.params._darknodeID.toHexString();
    const registry = DarknodeRegistry.bind(event.address);
    const epoch = Epoch.load(registry.currentEpoch().value0.toString());
    const darknode = Darknode.load(id);
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
    const epochID = event.params.epochhash.toString();
    const registry = DarknodeRegistry.bind(event.address);

    const BTCGateway = Gateway.bind(Address.fromString(btcGateway.slice(2)));
    const ZECGateway = Gateway.bind(Address.fromString(zecGateway.slice(2)));
    const BCHGateway = Gateway.bind(Address.fromString(bchGateway.slice(2)));

    const darknodePayment = DarknodePayment.bind(registry.darknodePayment());

    const previousEpochID = (registry.previousEpoch()).value0.toString();

    const previousEpoch = Epoch.load(previousEpochID);

    const epoch = new Epoch(epochID);
    epoch.createdTimestamp = event.block.timestamp;
    epoch.blockNumber = event.block.number;
    epoch.nextEpochBlockNumber = event.block.number.plus(registry.nextMinimumEpochInterval());

    epoch.numberOfDarknodes = registry.numDarknodes();
    epoch.numberOfDarknodesLastEpoch = registry.numDarknodesPreviousEpoch();
    epoch.numberOfDarknodesNextEpoch = registry.numDarknodesNextEpoch();

    const btcShare = !BTCGateway.try_minimumBurnAmount().reverted ? darknodePayment.previousCycleRewardShare(BTCGateway.token()) : new BigInt(0);
    epoch.rewardShareBTC = btcShare;
    epoch.totalRewardShareBTC = previousEpoch !== null ? epoch.rewardShareBTC.plus(previousEpoch.totalRewardShareBTC) : epoch.rewardShareBTC;

    const zecShare = !ZECGateway.try_minimumBurnAmount().reverted ? darknodePayment.previousCycleRewardShare(ZECGateway.token()) : new BigInt(0);
    epoch.rewardShareZEC = zecShare;
    epoch.totalRewardShareZEC = previousEpoch !== null ? epoch.rewardShareZEC.plus(previousEpoch.totalRewardShareZEC) : epoch.rewardShareZEC;

    const bchShare = !BCHGateway.try_minimumBurnAmount().reverted ? darknodePayment.previousCycleRewardShare(BCHGateway.token()) : new BigInt(0);
    epoch.rewardShareBCH = bchShare;
    epoch.totalRewardShareBCH = previousEpoch !== null ? epoch.rewardShareBCH.plus(previousEpoch.totalRewardShareBCH) : epoch.rewardShareBCH;

    epoch.save();
}
