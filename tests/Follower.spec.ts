import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Follower } from '../wrappers/Follower';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Follower', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Follower');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let follower: SandboxContract<Follower>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        follower = blockchain.openContract(Follower.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await follower.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: follower.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and follower are ready to use
    });
});
