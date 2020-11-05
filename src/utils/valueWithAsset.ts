import { BigInt } from "@graphprotocol/graph-ts";

import { Asset, ValueWithAsset } from "../../generated/schema";
import { zero } from "./common";

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

    let assetValue = ValueWithAsset.load(id);
    if (assetValue == null) {
        assetValue = new ValueWithAsset(id);
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
