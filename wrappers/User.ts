import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type UserConfig = {};

export function userConfigToCell(config: UserConfig): Cell {
    return beginCell().endCell();
}

export class User implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) { }

    static createFromAddress(address: Address) {
        return new User(address);
    }

    static createFromConfig(config: UserConfig, code: Cell, workchain = 0) {
        const data = userConfigToCell(config);
        const init = { code, data };
        return new User(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getFollowerAddress(provider: ContractProvider, followerWalletAddress: Address) {
        const result = await provider.get('get_follower_address', [{ type: 'slice', cell: beginCell().storeAddress(followerWalletAddress).endCell() }]);
        return result.stack.readAddress();
    }

    async getTotalShares(provider: ContractProvider) {
        const result = await provider.get('get_total_shares', []);
        return result.stack.readBigNumber();
    }

    async getBuyPrice(provider: ContractProvider, sharesNumber: number) {
        const result = await provider.get('get_buy_price', [{ type: 'int', value: BigInt(sharesNumber) }]);
        return result.stack.readBigNumber();
    }

    async getSellPrice(provider: ContractProvider, sharesNumber: number) {
        const result = await provider.get('get_sell_price', [{ type: 'int', value: BigInt(sharesNumber) }]);
        return result.stack.readBigNumber();
    }
}
