// tslint:disable: only-arrow-functions prefer-for-of

import { BigInt } from "@graphprotocol/graph-ts";

import { Gateway } from "../generated/GatewayRegistry/Gateway";
import { LogGatewayRegistered } from "../generated/GatewayRegistry/GatewayRegistry";
import { RenERC20 } from "../generated/GatewayRegistry/RenERC20";
import { Asset } from "../generated/schema";
import { Gateway as GatewayTemplate } from "../generated/templates";
import { setAmount } from "./utils/assetAmount";
import { getRenVM, zero, zeroDot } from "./utils/common";
import { setValue } from "./utils/valueWithAsset";

export function handleLogGatewayRegistered(event: LogGatewayRegistered): void {
    let gatewayAddress = event.params._gatewayContract;
    let gateway = Gateway.bind(gatewayAddress);
    let token = RenERC20.bind(gateway.token());

    let symbol = token.symbol();
    let decimals = token.decimals();

    GatewayTemplate.create(gatewayAddress);

    let renVM = getRenVM(event.block);

    let asset: Asset | null = Asset.load(symbol);
    if (asset === null) {
        asset = new Asset(symbol);
        asset.decimals = BigInt.fromI32(decimals);
        asset.priceInEth = zeroDot();
        asset.priceInUsd = zeroDot();

        renVM.txCount = setValue(
            renVM.txCount,
            renVM.id,
            "txCount",
            symbol,
            zero()
        );
        renVM.locked = setAmount(
            renVM.locked,
            renVM.id,
            "locked",
            symbol,
            zero()
        );
        renVM.volume = setAmount(
            renVM.volume,
            renVM.id,
            "volume",
            symbol,
            zero()
        );
        renVM.fees = setAmount(renVM.fees, renVM.id, "fees", symbol, zero());
        renVM.mintFee = setValue(
            renVM.mintFee,
            renVM.id,
            "mintFee",
            symbol,
            BigInt.fromI32(gateway.mintFee())
        );
        renVM.burnFee = setValue(
            renVM.burnFee,
            renVM.id,
            "burnFee",
            symbol,
            BigInt.fromI32(gateway.burnFee())
        );
        renVM.cycleRewards = setAmount(
            renVM.cycleRewards,
            renVM.id,
            "cycleRewards",
            symbol,
            zero()
        );
    }

    asset.gatewayAddress = token.owner().toHexString();
    asset.tokenAddress = token._address.toHexString();
    asset.symbol = symbol;

    asset.save();

    renVM.save();
}
