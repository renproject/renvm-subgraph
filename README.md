![Subgraph](./subgraph.png)

### RenVM Subgraph

Currently deployed at
* Mainnet: https://thegraph.com/explorer/subgraph/renproject/renvm
* Testnet: https://thegraph.com/explorer/subgraph/renproject/renvm-testnet

## Examples

### Send a QUERY with cURL:

Shell command:

```sh
curl \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{ "query": "{ transactions { id, amount } }" }' \
  https://api.thegraph.com/subgraphs/name/renproject/renvm
```

### Get daily BTC volume

GraphQL query:

```graphql
query get24HourVolume {
    periodDatas(where: {type: HOUR }, orderBy: date, orderDirection: desc, first: 24) {
    id
    type
    date
    totalTxCountBTC
    totalLockedBTC
    totalVolumeBTC
    periodTxCountBTC
    periodVolumeBTC
    periodLockedBTC
  }
}
```

## Developing locally

Follow the instructions at <https://thegraph.com/docs/quick-start>.

Some things to note:
1. Pass `-d` to `ganache-cli` so generate contracts with the same addresses as `config/ganache.json`.
2. If you restart `ganache-cli`, you may have to run `sudo rm -r data/postgres` in the `graph-node/docker` directory.

## Deploying to thegraph.com

Authorize, using the AUTH_CODE found in your thegraph.com account:

```sh
graph auth https://api.thegraph.com/deploy/ <AUTH_CODE>
```

Then run one of:

```sh
yarn deploy:mainnet
yarn deploy:chaosnet
yarn deploy:testnet
yarn deploy:devnet
```
