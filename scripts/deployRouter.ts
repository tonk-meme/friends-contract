import { toNano, Address } from '@ton/core';
import { Router } from '../wrappers/Router';
import { compile, NetworkProvider, sleep } from '@ton/blueprint';
import { User } from '../wrappers/User';

export async function run(provider: NetworkProvider) {
    const router = provider.open(Router.createFromConfig({
        protocolFeeDestination: provider.sender().address,
        protocolFeePercent: 10,
        ownerFeePercent: 5,
        userContractCode: await compile('User'),
        followerContractCode: await compile('Follower'),
    }, await compile('Router')));

    await router.sendDeploy(provider.sender(), toNano('0.05'));
    await provider.waitForDeploy(router.address);

    await router.sendRegisterUser(provider.sender());
    await sleep(60 * 1000);
    let userContractAddress: Address = await router.getUserAddress(provider.sender().address);
    const userContract = provider.open(User.createFromAddress(userContractAddress));
    console.log("Total Shares:", await userContract.getTotalShares());

    await router.sendBuyShares(provider.sender(), provider.sender().address, 1, toNano('1.3'));
    await sleep(60 * 1000);
    console.log("Total Shares:", await userContract.getTotalShares());

    await router.sendSellShares(provider.sender(), provider.sender().address, 1);
    await sleep(60 * 1000);
    console.log("Total Shares:", await userContract.getTotalShares());
}
