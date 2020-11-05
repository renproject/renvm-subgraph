import { Address, log } from "@graphprotocol/graph-ts";

import { Gateway } from "../generated/BTCGateway/Gateway";
import {
    ChangeCycleCall,
    DarknodePayment,
    LogDarknodeClaim,
    LogDarknodeWithdrew,
    WithdrawCall,
} from "../generated/DarknodePayment/DarknodePayment";
import { DarknodeRegistry } from "../generated/DarknodeRegistry/DarknodeRegistry";
import { RenERC20 } from "../generated/GatewayRegistry/RenERC20";
import { Epoch } from "../generated/schema";
import { bch, bchGateway, btc, btcGateway, zec, zecGateway } from "./_config";
import { setAmount } from "./utils/assetAmount";
import { getDarknode, getRenVM, one, zero } from "./utils/common";

export function handleLogDarknodeWithdrew(event: LogDarknodeWithdrew): void {}

export function handleLogDarknodeClaim(event: LogDarknodeClaim): void {
    let BTCGateway = Gateway.bind(Address.fromString(btcGateway.slice(2)));
    let ZECGateway = Gateway.bind(Address.fromString(zecGateway.slice(2)));
    let BCHGateway = Gateway.bind(Address.fromString(bchGateway.slice(2)));
    let darknodePayment = DarknodePayment.bind(event.address);
    let darknodeID = event.params._darknode;
    let darknode = getDarknode(darknodeID);
    darknode.previousLastClaimedEpoch = darknode.lastClaimedEpoch;
    darknode.lastClaimedEpoch = event.params._cycle;

    darknode.balanceBTC = darknodePayment.darknodeBalances(
        Address.fromString(darknodeID.toHexString()),
        BTCGateway.token()
    );
    darknode.balanceZEC = darknodePayment.darknodeBalances(
        Address.fromString(darknodeID.toHexString()),
        ZECGateway.token()
    );
    darknode.balanceBCH = darknodePayment.darknodeBalances(
        Address.fromString(darknodeID.toHexString()),
        BCHGateway.token()
    );

    let i = zero();
    while (true) {
        let tokens = darknodePayment.try_registeredTokens(i);
        if (tokens.reverted || tokens.value.equals(Address.fromI32(0))) {
            break;
        } else {
            let token = RenERC20.bind(tokens.value);
            let symbol = token.try_symbol();
            if (symbol.reverted) {
                break;
            }
            let balance = darknodePayment.darknodeBalances(
                Address.fromString(darknodeID.toHexString()),
                token._address
            );
            darknode.balances = setAmount(
                darknode.balances,
                darknode.id,
                "balances",
                symbol.value,
                balance
            );
        }
        i = i.plus(one());
    }

    darknode.save();
}

export function handleWithdraw(call: WithdrawCall): void {
    let darknodePayment = DarknodePayment.bind(call.to);

    let btcToken = Address.fromString(btc.slice(2));
    let zecToken = Address.fromString(zec.slice(2));
    let bchToken = Address.fromString(bch.slice(2));

    let darknodeID = call.inputs._darknode;

    let darknode = getDarknode(darknodeID);

    darknode.balanceBTC = darknodePayment.darknodeBalances(
        darknodeID,
        btcToken
    );

    darknode.balanceZEC = darknodePayment.darknodeBalances(
        darknodeID,
        zecToken
    );

    darknode.balanceBCH = darknodePayment.darknodeBalances(
        darknodeID,
        bchToken
    );

    let token = RenERC20.bind(call.inputs._token);
    let symbol = token.symbol();
    let balance = darknodePayment.darknodeBalances(
        Address.fromString(darknodeID.toHexString()),
        token._address
    );
    darknode.balances = setAmount(
        darknode.balances,
        darknode.id,
        "balances",
        symbol,
        balance
    );

    darknode.save();

    // Update RenVM's updated block.
    getRenVM(call.block);
}

export function handleChangeCycle(call: ChangeCycleCall): void {
    let darknodePayment = DarknodePayment.bind(call.to);

    let renVM = getRenVM(call.block);
    renVM.currentCyclePayoutPercent = darknodePayment.currentCyclePayoutPercent();
    renVM.currentCycle = darknodePayment.currentCycle();
    renVM.previousCycle = darknodePayment.previousCycle();
    renVM.cycleStartTime = darknodePayment.cycleStartTime();
    renVM.save();
}
