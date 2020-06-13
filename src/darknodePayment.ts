import {
    ChangeCycleCall, DarknodePayment, LogDarknodeClaim, LogDarknodeWithdrew,
} from "../generated/DarknodePayment/DarknodePayment";
import { Darknode } from "../generated/schema";
import { getRenVM } from "./common";

export function handleLogDarknodeWithdrew(event: LogDarknodeWithdrew): void {
}

export function handleLogDarknodeClaim(event: LogDarknodeClaim): void {
    let darknodeID = event.params._darknode;
    let darknode = new Darknode(darknodeID.toHexString());
    darknode.lastClaimedEpoch = event.params._cycle;
    darknode.save();
}

export function handleChangeCycle(call: ChangeCycleCall): void {
    let darknodePayment = DarknodePayment.bind(call.to);

    let renVM = getRenVM();
    renVM.currentCyclePayoutPercent = darknodePayment.currentCyclePayoutPercent();
    renVM.currentCycle = darknodePayment.currentCycle();
    renVM.previousCycle = darknodePayment.previousCycle();
    renVM.cycleStartTime = darknodePayment.cycleStartTime();
    renVM.save();
}