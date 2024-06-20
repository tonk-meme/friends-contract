import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, toNano } from '@ton/core';

export type RouterConfig = {
    protocolFeeDestination: Address | undefined,
    protocolFeePercent: number,
    ownerFeePercent: number,
    userContractCode: Cell,
    followerContractCode: Cell,
};

export function routerConfigToCell(config: RouterConfig): Cell {
    const fees: Cell = beginCell().storeAddress(config.protocolFeeDestination).storeUint(config.protocolFeePercent, 8).storeUint(config.ownerFeePercent, 8).endCell();
    const codes: Cell = beginCell().storeRef(config.userContractCode).storeRef(config.followerContractCode).endCell();
    return beginCell().storeRef(fees).storeRef(codes).endCell();
}

export class Router implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) { }

    static createFromAddress(address: Address) {
        return new Router(address);
    }

    static createFromConfig(config: RouterConfig, code: Cell, workchain = 0) {
        const data = routerConfigToCell(config);
        const init = { code, data };
        return new Router(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendRegisterUser(provider: ContractProvider, via: Sender,) {
        await provider.internal(via, {
            value: toNano('0.1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(1, 32).storeUint(0, 64).storeAddress(via.address).storeUint(1, 256).endCell(),
        });
    }

    async sendBuyShares(provider: ContractProvider, via: Sender, buySharesFrom: Address | undefined, sharesNumber: number, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(1, 32).storeUint(0, 64).storeAddress(buySharesFrom).storeUint(sharesNumber, 256).endCell(),
        });
    }

    async sendSellShares(provider: ContractProvider, via: Sender, sellSharesOf: Address | undefined, sharesNumber: number) {
        await provider.internal(via, {
            value: toNano('0.1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(2, 32).storeUint(0, 64).storeAddress(sellSharesOf).storeUint(sharesNumber, 256).endCell(),
        });
    }

    async getUserAddress(provider: ContractProvider, userWalletAddress: Address | undefined) {
        const result = await provider.get('get_user_address', [{ type: 'slice', cell: beginCell().storeAddress(userWalletAddress).endCell() }]);
        return result.stack.readAddress();
    }

    async getFollowerAddress(provider: ContractProvider, userWalletAddress: Address | undefined, followerWalletAddress: Address | undefined) {
        const result = await provider.get('get_follower_address', [
            { type: 'slice', cell: beginCell().storeAddress(userWalletAddress).endCell() },
            { type: 'slice', cell: beginCell().storeAddress(followerWalletAddress).endCell() }
        ]);
        return result.stack.readAddress();
    }

    async getFeeData(provider: ContractProvider) {
        const result = await provider.get('get_fee_data', []);
        return [result.stack.readAddress(), result.stack.readBigNumber(), result.stack.readBigNumber()];
    }
}
