import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

import { RenERC20 } from "../../generated/templates/Gateway/RenERC20";
import { UniswapExchange } from "../../generated/templates/Gateway/UniswapExchange";
import { UniswapFactory } from "../../generated/templates/Gateway/UniswapFactory";
import { uniswapFactoryAddress, usdAddress, wethAddress } from "../_config";
import { I32, zeroDot } from "./common";

let uniswapFactory = Address.fromString(uniswapFactoryAddress);
let weth = Address.fromString(wethAddress);
let usd = Address.fromString(usdAddress);

const getTokenDecimals = (token: Address): ethereum.CallResult<I32> => {
    if (token.equals(weth) || token.equals(usd)) {
        return ethereum.CallResult.fromValue(18);
    }
    let tokenContract = RenERC20.bind(token);
    return tokenContract.try_decimals();
};

const getPairPrice = (token1: Address, token2: Address): BigDecimal => {
    let factory = UniswapFactory.bind(uniswapFactory);

    let try_token1Decimals = getTokenDecimals(token1);
    if (try_token1Decimals.reverted) {
        return zeroDot();
    }
    let token1Decimals = BigInt.fromI32(
        try_token1Decimals.value
    ).toBigDecimal();

    let try_token2Decimals = getTokenDecimals(token2);
    if (try_token2Decimals.reverted) {
        return zeroDot();
    }
    let token2Decimals = BigInt.fromI32(
        try_token2Decimals.value
    ).toBigDecimal();

    let exchangeAddress = factory.try_getPair(token1, token2);
    if (exchangeAddress.reverted) {
        return zeroDot();
    }

    let exchange = UniswapExchange.bind(exchangeAddress.value);

    let firstToken = exchange.try_token0();
    if (firstToken.reverted) {
        return zeroDot();
    }

    let reserves = exchange.try_getReserves();
    if (reserves.reverted) {
        return zeroDot();
    }

    let token1Reserve = token1.equals(firstToken.value)
        ? reserves.value.value0
        : reserves.value.value1;
    let token2Reserve = token2.equals(firstToken.value)
        ? reserves.value.value0
        : reserves.value.value1;

    return token2Reserve
        .toBigDecimal()
        .div(token2Decimals)
        .div(token1Reserve.toBigDecimal().div(token1Decimals));
};

export const getPriceInEth = (token1: Address): BigDecimal => {
    return getPairPrice(token1, weth);
};

export const getPriceInUsd = (token1: Address): BigDecimal => {
    let priceInEth: BigDecimal = getPriceInEth(token1);
    let ethPriceInUsd: BigDecimal = getPairPrice(token1, weth);
    return priceInEth.times(ethPriceInUsd);
};
