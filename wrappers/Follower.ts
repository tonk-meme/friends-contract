import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type FollowerConfig = {};

export function followerConfigToCell(config: FollowerConfig): Cell {
    return beginCell().endCell();
}

export class Follower implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) { }

    static createFromAddress(address: Address) {
        return new Follower(address);
    }

    static createFromConfig(config: FollowerConfig, code: Cell, workchain = 0) {
        const data = followerConfigToCell(config);
        const init = { code, data };
        return new Follower(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getMyShares(provider: ContractProvider) {
        const result = await provider.get('get_my_shares', []);
        return result.stack.readBigNumber();
    }
}
