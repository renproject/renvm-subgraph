import { BigInt, TypedMap, Address } from "@graphprotocol/graph-ts"
import {
  Contract,
  LogShiftIn,
  LogShiftOut,
  OwnershipTransferred
} from "../generated/BCHShifter/Contract"
import { Transaction } from "../generated/schema"

export function handleLogShiftIn(event: LogShiftIn): void {
  let txid = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  let tx = new Transaction(txid)

  let contract = Contract.bind(event.address)
  let to = event.transaction.to

  tx._createdTimestamp = event.block.timestamp
  tx._asset = 'zBCH'
  tx._amount = event.params._amount
  tx._feeRate = BigInt.fromI32(contract.shiftInFee())
  tx._type = "mint"
  tx._adapterAddress = to
  tx.save()
}

export function handleLogShiftOut(event: LogShiftOut): void {
  let txid = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  let tx = new Transaction(txid)

  let contract = Contract.bind(event.address)
  let to = event.transaction.to

  tx._createdTimestamp = event.block.timestamp
  tx._asset = 'zBCH'
  tx._amount = event.params._amount
  tx._feeRate = BigInt.fromI32(contract.shiftInFee())
  tx._type = "burn"
  tx._adapterAddress = to
  tx.save()
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}
