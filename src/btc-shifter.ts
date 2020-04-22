import { BigInt, TypedMap, Address } from "@graphprotocol/graph-ts"
import {
  Contract,
  LogShiftIn,
  LogShiftOut,
  OwnershipTransferred
} from "../generated/BTCShifter/Contract"
import { Transaction } from "../generated/schema"

// let CONTRACT_SYMBOL_MAP = new TypedMap<string, string>()
// CONTRACT_SYMBOL_MAP.set('0x1258d7FF385d1d81017d4a3d464c02f74C61902a', 'zBTC')
// CONTRACT_SYMBOL_MAP.set('0x2b59Ef3Eb28c7388c7eC69d43a9b8E585C461d5b', 'zZEC')
// CONTRACT_SYMBOL_MAP.set('0xa76beA11766E0b66bD952bc357CF027742021a8C', 'zBCH')

export function handleLogShiftIn(event: LogShiftIn): void {

  let txid = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  let tx = new Transaction(txid)

  let contract = Contract.bind(event.address)
  let to = event.transaction.to

  tx._createdTimestamp = event.block.timestamp
  tx._asset = 'zBTC'
  tx._amount = event.params._amount
  tx._feeRate = BigInt.fromI32(contract.shiftInFee())
  tx._type = "mint"
  tx._adapterAddress = to
  tx.save()

  // txs._items.push(txid)
  //
  // txs.save()

  // // Entities can be loaded from the store using a string ID; this ID
  // // needs to be unique across all entities of the same type
  // let entity = ExampleEntity.load(event.transaction.from.toHex())
  //
  // // Entities only exist after they have been saved to the store;
  // // `null` checks allow to create entities on demand
  // if (entity == null) {
  //   entity = new ExampleEntity(event.transaction.from.toHex())
  //
  //   // Entity fields can be set using simple assignments
  //   entity.count = BigInt.fromI32(0)
  // }
  //
  // // BigInt and BigDecimal math are supported
  // entity.count = entity.count + BigInt.fromI32(1)
  //
  // // Entity fields can be set based on event parameters
  // entity._to = event.params._to
  // entity._amount = event.params._amount
  //
  // // Entities can be written to the store with `.save()`
  // entity.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.feeRecipient(...)
  // - contract.hashForSignature(...)
  // - contract.isOwner(...)
  // - contract.minShiftAmount(...)
  // - contract.mintAuthority(...)
  // - contract.nextShiftID(...)
  // - contract.owner(...)
  // - contract.shiftIn(...)
  // - contract.shiftInFee(...)
  // - contract.shiftOut(...)
  // - contract.shiftOutFee(...)
  // - contract.status(...)
  // - contract.token(...)
  // - contract.verifySignature(...)
  // - contract.version(...)
}

export function handleLogShiftOut(event: LogShiftOut): void {
  let txid = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  let tx = new Transaction(txid)

  let contract = Contract.bind(event.address)
  let to = event.transaction.to

  tx._createdTimestamp = event.block.timestamp
  tx._asset = 'zBTC'
  tx._amount = event.params._amount
  tx._feeRate = BigInt.fromI32(contract.shiftInFee())
  tx._type = "burn"
  tx._adapterAddress = to
  tx.save()
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}
