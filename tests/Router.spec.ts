import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, fromNano } from '@ton/core';
import { Router } from '../wrappers/Router';
import { User } from '../wrappers/User';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Router', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Router');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let router: SandboxContract<Router>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        router = blockchain.openContract(Router.createFromConfig({
            protocolFeeDestination: deployer.address,
            protocolFeePercent: 10,
            ownerFeePercent: 5,
            userContractCode: await compile('User'),
            followerContractCode: await compile('Follower'),
        }, code));

        const deployResult = await router.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: router.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        await router.sendRegisterUser(deployer.getSender());
        const userAddress = await router.getUserAddress(deployer.address);
        const user = blockchain.openContract(User.createFromAddress(userAddress));
        console.log("Share Number", 1, "Price:", 0.1, "(including protocol fees, user royalty and network fees)"); // 0.1 calculation fee
        for (let i = 1; i <= 10; i++) {
            console.log("Share Number", i + 1, "Price:", Number(fromNano(await user.getBuyPrice(i) - await user.getBuyPrice(i - 1))) + 0.1, "(including protocol fees, user royalty and network fees)"); // 0.1 calculation fee
        }
    });
});
