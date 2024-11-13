# Mina Batch Reducer Example - Counter

This repository provides a minimal example demonstrating the use of the `BatchReducer` functionality in the Mina Protocol, as presented in [o1-labs/o1js PR #1676](https://github.com/o1-labs/o1js/pull/1676). The example implements a simple counter smart contract that accumulates a running total of values submitted in batches using Mina’s `BatchReducer`. This example also includes tests to verify the correct behavior of the counter and batch reducer.

## Getting Started

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/mina-batch-reducer-counter.git
   cd mina-batch-reducer-counter
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Code Overview

### Smart Contract

The `Add` smart contract maintains a running total of values added through batch processing.

- **State Variables**:

  - `totalSum`: Stores the accumulated total.
  - `actionState` and `actionStack`: Used by the batch reducer to maintain the state and action stack for batching.

- **Methods**:
  - `add(value: Field)`: Dispatches an action to add a non-negative value to the total.
  - `batchReduce(batch: Batch, proof: BatchProof)`: Processes a batch of actions, updating `totalSum` by adding values from the batch.

### Test

The test file verifies the correct behavior of the `Add` contract:

- Deploys the contract locally on a Mina test network.
- Dispatches multiple actions and then reduces them in batches.
- Asserts that `totalSum` reflects only the values processed through the batch reducer.
- Confirms that the actions are processed only once by checking `totalSum` after multiple reductions.

## Running the Tests

To run the tests, use the following command:

```bash
npm test
```

The tests will:

1. Deploy the `Add` contract and verify the initial state.
2. Dispatch actions and perform batch reduction.
3. Verify that `totalSum` is updated as expected after each batch reduction.
