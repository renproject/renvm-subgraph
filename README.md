# RenVM Subgraph

Currently deployed at
1. Mainnet: https://thegraph.com/explorer/subgraph/noiach/renvm
1. Chaosnet: https://thegraph.com/explorer/subgraph/noiach/renvm-chaosnet
1. Testnet: https://thegraph.com/explorer/subgraph/noiach/renvm-testnet
1. Devnet: https://thegraph.com/explorer/subgraph/noiach/renvm-devnet

## Examples

### Send a QUERY with cURL:

Shell command:

```sh
curl \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{ "query": "{ transactions { id, amount } }" }' \
  https://api.thegraph.com/subgraphs/name/noiach/renvm
```

### Get daily BTC volume

GraphQL query:

```graphql
{
  periodDatas(where: { type: DAY }) {
    id
    totalTxCountBTC
    totalLockedBTC
    totalVolumeBTC
		periodTxCountBTC
		periodLockedBTC
		periodVolumeBTC
  }
}
```

## Developing locally

Follow the instructions at <https://thegraph.com/docs/quick-start>.

Some things to note:
1. Pass `-d` to `ganache-cli` so generate contracts with the same addresses as `config/ganache.json`.
2. If you restart `ganache-cli`, you may have to run `sudo rm -r data/postgres` in the `graph-node/docker` directory.

## Deploying to thegraph.com

```sh
yarn deploy:mainnet
yarn deploy:chaosnet
yarn deploy:testnet
yarn deploy:devnet
```