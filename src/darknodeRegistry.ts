// tslint:disable: only-arrow-functions prefer-for-of

import {
    DarknodeRegistry, LogDarknodeDeregistered, LogDarknodeRegistered, LogNewEpoch,
} from "../generated/DarknodeRegistry/DarknodeRegistry";
import { Darknode, Epoch } from "../generated/schema";

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
  const id = event.params.epochhash.toString();
  const registry = DarknodeRegistry.bind(event.address);
  const epoch = new Epoch(id);
  epoch.createdTimestamp = event.block.timestamp;
  epoch.blockNumber = event.block.number;
  epoch.nextEpochBlockNumber = event.block.number.plus(registry.nextMinimumEpochInterval());

  epoch.save();
}

