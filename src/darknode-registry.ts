import { BigInt, TypedMap, Address } from "@graphprotocol/graph-ts"
import {
  DarknodeRegistry,
  LogDarknodeRegistered,
  LogDarknodeDeregistered,
  LogNewEpoch
} from "../generated/DarknodeRegistry/DarknodeRegistry"
import { Darknode, Epoch } from "../generated/schema"

export function handleLogDarknodeRegistered(event: LogDarknodeRegistered): void {
  let id = event.params._darknodeID.toHexString()
  let registry = DarknodeRegistry.bind(event.address)

  let epoch = Epoch.load(registry.currentEpoch().value0.toString())
  let darknode = new Darknode(id)
  darknode._operator = event.params._operator
  darknode._isRegistered = true
  // if (event.block.timestamp) {
    darknode._registeredTimestamp = event.block.timestamp
  // }
  if (epoch !== null){
    darknode._startBlock = epoch._nextEpochBlockNumber
  }
  darknode.save()
}

export function handleLogDarknodeDeregistered(event: LogDarknodeDeregistered): void {
  let id = event.params._darknodeID.toHexString()
  let registry = DarknodeRegistry.bind(event.address)
  let epoch = Epoch.load(registry.currentEpoch().value0.toString())
  let darknode = Darknode.load(id)
  if (darknode !== null) {
    darknode._operator = event.params._operator
    darknode._isRegistered = false
    // if (event.block.timestamp) {
      darknode._deregisteredTimestamp = event.block.timestamp
    // }
    if (epoch !== null){
      darknode._endBlock = epoch._nextEpochBlockNumber
    }
    darknode.save()
  }
}

export function handleLogNewEpoch(event: LogNewEpoch): void {
  let id = event.params.epochhash.toString()
  let registry = DarknodeRegistry.bind(event.address)
  let epoch = new Epoch(id)
  epoch._createdTimestamp = event.block.timestamp
  epoch._blockNumber = event.block.number
  epoch._nextEpochBlockNumber = event.block.number + registry.nextMinimumEpochInterval()

  epoch.save()
}
