import { Address } from "@graphprotocol/graph-ts";

import { Gateway } from "../generated/BTCGateway/Gateway";
import {
    ChangeCycleCall,
    DarknodePayment,
    LogDarknodeClaim,
    LogDarknodeWithdrew,
    WithdrawCall,
} from "../generated/DarknodePayment/DarknodePayment";
import { bchGateway, btcGateway, zecGateway } from "./_config";
import { getDarknode, getRenVM } from "./common";

export function handleLogDarknodeWithdrew(event: LogDarknodeWithdrew): void {
}

export function handleLogDarknodeClaim(event: LogDarknodeClaim): void {
    let BTCGateway = Gateway.bind(Address.fromString(btcGateway.slice(2)));
    let ZECGateway = Gateway.bind(Address.fromString(zecGateway.slice(2)));
    let BCHGateway = Gateway.bind(Address.fromString(bchGateway.slice(2)));

    let darknodePayment = DarknodePayment.bind(event.address);

    let darknodeID = event.params._darknode;
    let darknode = getDarknode(darknodeID);
    darknode.previousLastClaimedEpoch = darknode.lastClaimedEpoch;
    darknode.lastClaimedEpoch = event.params._cycle;

    darknode.balanceBTC = darknodePayment.darknodeBalances(Address.fromHexString(darknodeID.toHexString()) as Address, BTCGateway.token())
    darknode.balanceZEC = darknodePayment.darknodeBalances(Address.fromHexString(darknodeID.toHexString()) as Address, ZECGateway.token())
    darknode.balanceBCH = darknodePayment.darknodeBalances(Address.fromHexString(darknodeID.toHexString()) as Address, BCHGateway.token())

    darknode.save();
}

export function handleWithdraw(call: WithdrawCall): void {
    let darknodePayment = DarknodePayment.bind(call.to);

    let BTCGateway = Gateway.bind(Address.fromString(btcGateway.slice(2)));
    let ZECGateway = Gateway.bind(Address.fromString(zecGateway.slice(2)));
    let BCHGateway = Gateway.bind(Address.fromString(bchGateway.slice(2)));

    let darknodeID = call.inputs._darknode;
    let darknode = getDarknode(darknodeID);

    let darknodeAddress: Address = Address.fromHexString(darknodeID.toHexString()) as Address;

    let btcToken = BTCGateway.token();
    let zecToken = ZECGateway.token();
    let bchToken = BCHGateway.token();

    let btcCall = darknodePayment.try_darknodeBalances(darknodeAddress, btcToken);
    if (!btcCall.reverted) { darknode.balanceBTC = btcCall.value; }
    let zecCall = darknodePayment.try_darknodeBalances(darknodeAddress, zecToken);
    if (!zecCall.reverted) { darknode.balanceZEC = zecCall.value; }
    let bchCall = darknodePayment.try_darknodeBalances(darknodeAddress, bchToken);
    if (!bchCall.reverted) { darknode.balanceBCH = bchCall.value; }

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