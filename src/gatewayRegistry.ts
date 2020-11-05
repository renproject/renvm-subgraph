// tslint:disable: only-arrow-functions prefer-for-of

import { BigInt } from "@graphprotocol/graph-ts";

import { Gateway } from "../generated/GatewayRegistry/Gateway";
import { LogGatewayRegistered } from "../generated/GatewayRegistry/GatewayRegistry";
import { RenERC20 } from "../generated/GatewayRegistry/RenERC20";
import { Asset } from "../generated/schema";
import { Gateway as GatewayTemplate } from "../generated/templates";
import { getRenVM, setValue, zero } from "./common";

export function handleLogGatewayRegistered(event: LogGatewayRegistered): void {
    let gatewayAddress = event.params._gatewayContract;
    let gateway = Gateway.bind(gatewayAddress);
    let token = RenERC20.bind(gateway.token());

    let symbol = token.symbol();

    GatewayTemplate.create(gatewayAddress);

    let renVM = getRenVM(event.block);

    let asset: Asset | null = Asset.load(symbol);
    if (asset === null) {
        asset = new Asset(symbol);

        renVM.txCount = setValue(
            renVM.txCount,
            renVM.id,
            "txCount",
            symbol,
            zero()
        );
        renVM.locked = setValue(
            renVM.locked,
            renVM.id,
            "locked",
            symbol,
            zero()
        );
        renVM.volume = setValue(
            renVM.volume,
            renVM.id,
            "volume",
            symbol,
            zero()
        );
        renVM.fees = setValue(renVM.fees, renVM.id, "fees", symbol, zero());
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
    }

    asset.gatewayAddress = token.owner().toHexString();
    asset.tokenAddress = token._address.toHexString();
    asset.symbol = symbol;

    asset.save();

    renVM.save();
}
