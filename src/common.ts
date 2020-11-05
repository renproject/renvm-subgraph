import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import {
    Asset,
    AssetValue,
    Darknode,
    Integrator,
    IntegratorContract,
    RenVM,
} from "../generated/schema";
import { resolveIntegratorID } from "./integrators";

// @ts-ignore - typescript doesn't like i32

export type I32 = i32;

export const zero = (): BigInt => {
    return BigInt.fromI32(0);
};

export const one = (): BigInt => {
    return BigInt.fromI32(1);
};

export const getIntegrator = (contractAddress: Bytes): Integrator => {
    let date: I32 = 0;

    let integratorID: string = resolveIntegratorID(contractAddress);
    let integrator: Integrator | null = Integrator.load(integratorID);

    if (integrator === null) {
        integrator = new Integrator(integratorID);
        integrator.txCountBTC = zero();
        integrator.lockedBTC = zero();
        integrator.volumeBTC = zero();

        integrator.txCountZEC = zero();
        integrator.lockedZEC = zero();
        integrator.volumeZEC = zero();

        integrator.txCountBCH = zero();
        integrator.lockedBCH = zero();
        integrator.volumeBCH = zero();

        integrator.txCount = [];
        integrator.locked = [];
        integrator.volume = [];
        integrator.fees = [];

        integrator.date = date;
    }

    // If there are multiple contracts associated with an integrator, store the
    // most recent contract.
    integrator.contractAddress = contractAddress;
    integrator.save();

    // tslint:disable-next-line: no-unnecessary-type-assertion
    return integrator as Integrator;
};

export const getIntegratorContract = (
    contractAddress: Bytes
): IntegratorContract => {
    let date: I32 = 0;

    let integratorContractID: string = contractAddress.toHexString();
    let integratorContract: IntegratorContract | null = IntegratorContract.load(
        integratorContractID
    );

    if (integratorContract === null) {
        integratorContract = new IntegratorContract(integratorContractID);
        integratorContract.txCountBTC = zero();
        integratorContract.lockedBTC = zero();
        integratorContract.volumeBTC = zero();

        integratorContract.txCountZEC = zero();
        integratorContract.lockedZEC = zero();
        integratorContract.volumeZEC = zero();

        integratorContract.txCountBCH = zero();
        integratorContract.lockedBCH = zero();
        integratorContract.volumeBCH = zero();

        integratorContract.txCount = [];
        integratorContract.locked = [];
        integratorContract.volume = [];
        integratorContract.fees = [];

        integratorContract.date = date;
    }

    // If there are multiple contracts associated with an integratorContract, store the
    // most recent contract.
    integratorContract.contractAddress = contractAddress;
    integratorContract.save();

    // tslint:disable-next-line: no-unnecessary-type-assertion
    return integratorContract as IntegratorContract;
};

export const getRenVM = (updateAtBlock: ethereum.Block): RenVM => {
    let renVM: RenVM | null = RenVM.load("1");

    if (renVM === null) {
        renVM = new RenVM("1");

        renVM.activeBlock = zero();
        renVM.activeTimestamp = zero();
        renVM.previousActiveBlock = zero();
        renVM.previousActiveTimestamp = zero();

        renVM.numberOfDarknodes = zero();
        renVM.numberOfDarknodesLastEpoch = zero();
        renVM.numberOfDarknodesNextEpoch = zero();

        renVM.minimumBond = zero();
        renVM.minimumEpochInterval = zero();
        renVM.deregistrationInterval = zero();

        renVM.btcMintFee = 0;
        renVM.btcBurnFee = 0;
        renVM.zecMintFee = 0;
        renVM.zecBurnFee = 0;
        renVM.bchMintFee = 0;
        renVM.bchBurnFee = 0;

        renVM.currentCycle = zero();
        renVM.previousCycle = zero();
        renVM.currentCyclePayoutPercent = zero();
        renVM.cycleStartTime = zero();

        renVM.totalTxCountBTC = zero();
        renVM.totalLockedBTC = zero();
        renVM.totalVolumeBTC = zero();

        renVM.totalTxCountZEC = zero();
        renVM.totalLockedZEC = zero();
        renVM.totalVolumeZEC = zero();

        renVM.totalTxCountBCH = zero();
        renVM.totalLockedBCH = zero();
        renVM.totalVolumeBCH = zero();

        renVM.mintFee = [];
        renVM.burnFee = [];
        renVM.txCount = [];
        renVM.locked = [];
        renVM.volume = [];
        renVM.fees = [];

        renVM.save();
    }

    renVM.previousActiveBlock = renVM.activeBlock;
    renVM.previousActiveTimestamp = renVM.activeTimestamp;
    renVM.activeBlock = updateAtBlock.number;
    renVM.activeTimestamp = updateAtBlock.timestamp;
    renVM.save();

    // tslint:disable-next-line: no-unnecessary-type-assertion
    return renVM as RenVM;
};

export const getDarknode = (darknodeID: Bytes): Darknode => {
    let darknode: Darknode | null = Darknode.load(darknodeID.toHexString());
    if (darknode == null) {
        darknode = new Darknode(darknodeID.toHexString());

        darknode.operator = Bytes.fromI32(0) as Bytes;
        darknode.bond = zero();
        darknode.registeredAt = zero();
        darknode.deregisteredAt = zero();
        darknode.publicKey = Bytes.fromI32(0) as Bytes;

        darknode.lastClaimedEpoch = zero();
        darknode.previousLastClaimedEpoch = zero();

        darknode.balanceBTC = zero();
        darknode.balanceZEC = zero();
        darknode.balanceBCH = zero();

        darknode.balances = [];

        darknode.save();
    }

    // tslint:disable-next-line: no-unnecessary-type-assertion
    return darknode as Darknode;
};

const updateValue = (
    array: string[],
    itemID: string,
    field: string,
    symbol: string,
    value: BigInt,
    set: boolean,
    add: boolean,
    subtract: boolean
): string[] => {
    let id = itemID + "_" + field + "_" + symbol;

    let asset = Asset.load(symbol);
    let assetSymbol: string | null = asset === null ? null : asset.symbol;

    let assetValue = AssetValue.load(id);
    if (assetValue == null) {
        assetValue = new AssetValue(id);
        assetValue.symbol = symbol;
        assetValue.asset = assetSymbol;
        assetValue.value = zero();
    }

    assetValue.value = set
        ? value
        : add
        ? assetValue.value.plus(value)
        : subtract
        ? assetValue.value.minus(value)
        : assetValue.value;
    assetValue.save();

    for (let i = 0; i < array.length; i++) {
        if (array[i] == id) {
            return array;
        }
    }
    array.push(id);
    return array;
};

export const setValue = (
    array: string[],
    itemID: string,
    field: string,
    asset: string,
    value: BigInt
): string[] => {
    return updateValue(array, itemID, field, asset, value, true, false, false);
};

export const addValue = (
    array: string[],
    itemID: string,
    field: string,
    asset: string,
    value: BigInt
): string[] => {
    return updateValue(array, itemID, field, asset, value, false, true, false);
};

export const subValue = (
    array: string[],
    itemID: string,
    field: string,
    asset: string,
    value: BigInt
): string[] => {
    return updateValue(array, itemID, field, asset, value, false, false, true);
};
