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
    epoch.rewardShareBTC = new BigInt(0); // darknodePayment.previousCycleRewardShare(BTCGateway.token());
    epoch.rewardShareZEC = new BigInt(0); // darknodePayment.previousCycleRewardShare(ZECGateway.token());
    epoch.rewardShareBCH = new BigInt(0); // darknodePayment.previousCycleRewardShare(BCHGateway.token());

    epoch.totalRewardShareBTC = epoch.rewardShareBTC
    epoch.totalRewardShareZEC = epoch.rewardShareZEC
    epoch.totalRewardShareBCH = epoch.rewardShareBCH

    if (previousEpoch !== null) {
        epoch.totalRewardShareBTC = epoch.rewardShareBTC.plus(previousEpoch.totalRewardShareBTC);
        epoch.totalRewardShareZEC = epoch.rewardShareZEC.plus(previousEpoch.totalRewardShareZEC);
        epoch.totalRewardShareBCH = epoch.rewardShareBCH.plus(previousEpoch.totalRewardShareBCH);
    }

    epoch.save();
}
