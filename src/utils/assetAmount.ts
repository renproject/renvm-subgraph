import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import { RenERC20 } from "../../generated/GatewayRegistry/RenERC20";
import { Asset, AssetAmount } from "../../generated/schema";
import { zero, zeroDot } from "./common";
import { exponent, getPriceInEth, getPriceInUsd } from "./uniswapPrices";

const updateAmount = (
    array: string[],
    itemID: string,
    field: string,
    symbol: string,
    amount: BigInt,
    set: boolean,
    add: boolean,
    subtract: boolean
): string[] => {
    let id = itemID + "_" + field + "_" + symbol;

    let asset = Asset.load(symbol);
    let assetSymbol: string | null = asset === null ? null : asset.symbol;

    let assetAmount = AssetAmount.load(id);
    if (assetAmount == null) {
        assetAmount = new AssetAmount(id);
        assetAmount.symbol = symbol;
        assetAmount.asset = assetSymbol;
        assetAmount.amount = zero();
        assetAmount.amountInEth = zeroDot();
        assetAmount.amountInUsd = zeroDot();
    }

    let assetPriceInEth = asset
        ? getPriceInEth(Address.fromString(asset.tokenAddress))
        : zeroDot();
    let assetPriceInUsd = asset
        ? getPriceInUsd(Address.fromString(asset.tokenAddress))
        : zeroDot();
    if (asset) {
        asset.priceInEth = assetPriceInEth;
        asset.priceInUsd = assetPriceInUsd;
        asset.save();
    }

    let decimals = asset ? asset.decimals.toBigDecimal() : zeroDot();
    let scaledPriceInEth = decimals.gt(zeroDot())
        ? assetPriceInEth.div(exponent(decimals))
        : assetPriceInEth;
    let scaledPriceInUsd = decimals.gt(zeroDot())
        ? assetPriceInUsd.div(exponent(decimals))
        : assetPriceInUsd;

    let amountDecimal = amount.toBigDecimal();
    let amountInEth: BigDecimal = amountDecimal
        .times(scaledPriceInEth)
        .truncate(18);
    let amountInUsd: BigDecimal = amountDecimal
        .times(scaledPriceInUsd)
        .truncate(2);

    // Check if previously there was no price available.
    if (
        assetAmount.amount.gt(zero()) &&
        assetAmount.amountInUsd.equals(zeroDot()) &&
        amountInUsd.gt(zeroDot())
    ) {
        // Use current price for historical values. This relies on the initial
        // price on Uniswap being set correctly.
        assetAmount.amountInEth = assetAmount.amount
            .toBigDecimal()
            .times(scaledPriceInEth)
            .truncate(18);
        assetAmount.amountInUsd = assetAmount.amount
            .toBigDecimal()
            .times(scaledPriceInUsd)
            .truncate(2);
    }

    assetAmount.amount = set
        ? amount
        : add
        ? assetAmount.amount.plus(amount)
        : subtract
        ? assetAmount.amount.minus(amount)
        : assetAmount.amount;
    assetAmount.amountInEth = set
        ? amountInEth
        : add
        ? assetAmount.amountInEth.plus(amountInEth)
        : subtract
        ? assetAmount.amountInEth.minus(amountInEth)
        : assetAmount.amountInEth;
    assetAmount.amountInUsd = set
        ? amountInUsd
        : add
        ? assetAmount.amountInUsd.plus(amountInUsd)
        : subtract
        ? assetAmount.amountInUsd.minus(amountInUsd)
        : assetAmount.amountInUsd;

    assetAmount.save();

    for (let i = 0; i < array.length; i++) {
        if (array[i] == id) {
            return array;
        }
    }
    array.push(id);
    return array;
};

export const setAmount = (
    array: string[],
    itemID: string,
    field: string,
    symbol: string,
    amount: BigInt
): string[] => {
    return updateAmount(
        array,
        itemID,
        field,
        symbol,
        amount,
        true,
        false,
        false
    );
};

export const addAmount = (
    array: string[],
    itemID: string,
    field: string,
    symbol: string,
    amount: BigInt
): string[] => {
    return updateAmount(
        array,
        itemID,
        field,
        symbol,
        amount,
        false,
        true,
        false
    );
};

export const subAmount = (
    array: string[],
    itemID: string,
    field: string,
    symbol: string,
    amount: BigInt
): string[] => {
    return updateAmount(
        array,
        itemID,
        field,
        symbol,
        amount,
        false,
        false,
        true
    );
};
