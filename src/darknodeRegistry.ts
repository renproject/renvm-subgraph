// tslint:disable: only-arrow-functions prefer-for-of

import { Address, log } from "@graphprotocol/graph-ts";

import { Gateway } from "../generated/BTCGateway/Gateway";
import { DarknodePayment } from "../generated/DarknodePayment/DarknodePayment";
import {
    DarknodeRegistry,
    LogDarknodeDeregistered,
    LogDarknodeRefunded,
    LogDarknodeRegistered,
    LogNewEpoch
} from "../generated/DarknodeRegistry/DarknodeRegistry";
import { RenERC20 } from "../generated/GatewayRegistry/RenERC20";
import { Epoch } from "../generated/schema";
import { bchGateway, btcGateway, zecGateway } from "./_config";
import { setAmount } from "./utils/assetAmount";
import {
    getDarknode,
    getRenVM,
    getTokenSymbol,
    one,
    zero
} from "./utils/common";
import { setValue } from "./utils/valueWithAsset";

export function handleLogDarknodeRegistered(
    event: LogDarknodeRegistered
): void {
    let darknodeID = event.params._darknodeID;
    let registry = DarknodeRegistry.bind(event.address);

    let epoch = Epoch.load(registry.currentEpoch().value0.toString());
    let darknode = getDarknode(darknodeID);
    darknode.operator = event.params._darknodeOperator;

    darknode.bond = event.params._bond;

    darknode.registeredAt = epoch.timestamp.plus(
        registry.minimumEpochInterval()
    );
    darknode.deregisteredAt = zero();

    darknode.publicKey = registry.getDarknodePublicKey(darknodeID);
    darknode.save();

    let renVM = getRenVM(event.block);
    renVM.numberOfDarknodesNextEpoch = registry.numDarknodesNextEpoch();
    renVM.save();
}

export function handleLogDarknodeDeregistered(
    event: LogDarknodeDeregistered
): void {
    let registry = DarknodeRegistry.bind(event.address);
    let epoch = Epoch.load(registry.currentEpoch().value0.toString());
    let darknode = getDarknode(event.params._darknodeID);
    if (darknode !== null) {
        darknode.operator = event.params._darknodeOperator;
        darknode.deregisteredAt = epoch.timestamp.plus(
            registry.minimumEpochInterval()
        );

        darknode.save();
    }

    let renVM = getRenVM(event.block);
    renVM.numberOfDarknodesNextEpoch = registry.numDarknodesNextEpoch();
    renVM.save();
}

export function handleLogDarknodeRefunded(event: LogDarknodeRefunded): void {
    let darknode = getDarknode(event.params._darknodeID);
    if (darknode !== null) {
        darknode.deregisteredAt = zero();
        darknode.registeredAt = zero();

        darknode.save();
    }

    // Update RenVM's latest active block.
    getRenVM(event.block);
}

export function handleLogNewEpoch(event: LogNewEpoch): void {
    let epochID = event.params.epochhash.toString();
    let registry = DarknodeRegistry.bind(event.address);

    let BTCGateway = Gateway.bind(Address.fromString(btcGateway.slice(2)));
    let ZECGateway = Gateway.bind(Address.fromString(zecGateway.slice(2)));
    let BCHGateway = Gateway.bind(Address.fromString(bchGateway.slice(2)));

    let darknodePayment = DarknodePayment.bind(registry.darknodePayment());

    let previousEpochID = registry.previousEpoch().value0.toString();

    let previousEpoch = Epoch.load(previousEpochID);

    let epoch = new Epoch(epochID);
    epoch.timestamp = event.block.timestamp;
    epoch.epochhash = event.params.epochhash;
    epoch.blockNumber = event.block.number;
    epoch.nextEpochBlockNumber = event.block.number.plus(
        registry.nextMinimumEpochInterval()
    );

    epoch.numberOfDarknodes = registry.numDarknodes();
    epoch.numberOfDarknodesLastEpoch = registry.numDarknodesPreviousEpoch();

    epoch.minimumBond = registry.minimumBond();
    epoch.minimumEpochInterval = registry.minimumEpochInterval();

    epoch.rewardShares = [];
    epoch.cumulativeRewardShares = [];

    let renVM = getRenVM(event.block);
    renVM.numberOfDarknodes = epoch.numberOfDarknodes;
    renVM.numberOfDarknodesLastEpoch = epoch.numberOfDarknodesLastEpoch;
    renVM.numberOfDarknodesNextEpoch = registry.numDarknodesNextEpoch();
    renVM.minimumBond = epoch.minimumBond;
    renVM.minimumEpochInterval = epoch.minimumEpochInterval;
    renVM.previousEpoch = renVM.currentEpoch;
    renVM.currentEpoch = epochID;
    renVM.deregistrationInterval = registry.deregistrationInterval();

    let btcShare = !BTCGateway.try_minimumBurnAmount().reverted
        ? darknodePayment.previousCycleRewardShare(BTCGateway.token())
        : zero();
    epoch.rewardShareBTC = btcShare;
    epoch.totalRewardShareBTC =
        previousEpoch !== null
            ? epoch.rewardShareBTC.plus(previousEpoch.totalRewardShareBTC)
            : epoch.rewardShareBTC;

    let zecShare = !ZECGateway.try_minimumBurnAmount().reverted
        ? darknodePayment.previousCycleRewardShare(ZECGateway.token())
        : zero();
    epoch.rewardShareZEC = zecShare;
    epoch.totalRewardShareZEC =
        previousEpoch !== null
            ? epoch.rewardShareZEC.plus(previousEpoch.totalRewardShareZEC)
            : epoch.rewardShareZEC;

    let bchShare = !BCHGateway.try_minimumBurnAmount().reverted
        ? darknodePayment.previousCycleRewardShare(BCHGateway.token())
        : zero();
    epoch.rewardShareBCH = bchShare;
    epoch.totalRewardShareBCH =
        previousEpoch !== null
            ? epoch.rewardShareBCH.plus(previousEpoch.totalRewardShareBCH)
            : epoch.rewardShareBCH;

    // Loop through registered tokens, storing cycle rewards.
    let i = zero();
    while (true) {
        let tokens = darknodePayment.try_registeredTokens(i);
        if (tokens.reverted || tokens.value.equals(Address.fromI32(0))) {
            break;
        } else {
            let token = RenERC20.bind(tokens.value);
            let trySymbol = getTokenSymbol(token);
            if (trySymbol.reverted) {
                log.warning(tokens.value.toHexString(), []);
                i = i.plus(one());
                continue;
            }

            let tryRewardShare = darknodePayment.try_previousCycleRewardShare(
                token._address
            );
            let rewardShare = tryRewardShare.reverted
                ? zero()
                : tryRewardShare.value;
            epoch.rewardShares = setAmount(
                epoch.rewardShares,
                epoch.id,
                "rewardShares",
                trySymbol.value,
                rewardShare
            );
            let cumulativeRewardShare =
                previousEpoch !== null
                    ? epoch.rewardShareBTC.plus(
                          previousEpoch.totalRewardShareBTC
                      )
                    : epoch.rewardShareBTC;
            epoch.cumulativeRewardShares = setAmount(
                epoch.cumulativeRewardShares,
                epoch.id,
                "cumulativeRewardShares",
                trySymbol.value,
                cumulativeRewardShare
            );

            let try_rewardPool = darknodePayment.try_currentCycleRewardPool(
                token._address
            );
            if (!try_rewardPool.reverted) {
                renVM.cycleFees = setValue(
                    renVM.cycleFees,
                    renVM.id,
                    "cycleFees",
                    trySymbol.value,
                    try_rewardPool.value
                );
            }
        }
        i = i.plus(one());
    }

    epoch.save();
    renVM.save();
}
