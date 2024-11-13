import {
  AccountUpdate,
  Field,
  MerkleList,
  Mina,
  PrivateKey,
  PublicKey,
  Reducer,
} from 'o1js';
import { Add, batchReducer } from './Add';

let proofsEnabled = false;

describe('Add', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    others: Mina.TestPublicKey[],
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: Add,
    doTest: (reduceFunction: () => Promise<void>) => Promise<void>;

  beforeAll(async () => {
    if (proofsEnabled) await Add.compile();
  });

  beforeEach(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    [deployerAccount, senderAccount, ...others] = Local.testAccounts;
    deployerKey = deployerAccount.key;
    senderKey = senderAccount.key;

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new Add(zkAppAddress);
    batchReducer.setContractInstance(zkApp);

    doTest = async (reduce: () => Promise<void>) => {
      await localDeploy();

      let expectedTotal = Field(0);

      // Dispatch all actions
      for (let i = 0; i < 5; i++) {
        let value = Field(i + 1);
        let sender = others[i];
        let tx = await Mina.transaction(sender, async () => {
          await zkApp.add(value);
        });

        await tx.prove();
        await tx.sign([sender.key]).send();

        expectedTotal = expectedTotal.add(value);
      }

      let curTotalSum = zkApp.totalSum.get();
      expect(curTotalSum).toEqual(Field(0));
      console.log(`Initial totalSum: ${curTotalSum}`);

      // Reduce
      await reduce();

      let finalTotalSum = zkApp.totalSum.get();
      expect(finalTotalSum).toEqual(expectedTotal);

      // Do reduce second time, so we can check, that actions processed only once
      await reduce();

      finalTotalSum = zkApp.totalSum.get();
      expect(finalTotalSum).toEqual(expectedTotal);
      console.log(`totalSum after first dispatch: ${finalTotalSum}`);

      // Dispatch more actions
      for (let i = 0; i < 5; i++) {
        let value = Field(i + 1);
        let sender = others[i];
        let tx = await Mina.transaction(sender, async () => {
          await zkApp.add(value);
        });

        await tx.prove();
        await tx.sign([sender.key]).send();

        expectedTotal = expectedTotal.add(value);
      }

      await reduce();

      finalTotalSum = zkApp.totalSum.get();
      expect(finalTotalSum).toEqual(expectedTotal);

      console.log(`totalSum after final dispatch: ${finalTotalSum}`);
    };
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      await zkApp.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('generates and deploys the `Add` smart contract', async () => {
    await localDeploy();
    const num = zkApp.totalSum.get();
    expect(num).toEqual(Field(0));
  });

  it('correctly updates the totalSum with batch reducer', async () => {
    const batchReduce = async () => {
      const batches = await batchReducer.prepareBatches();

      for (let i = 0; i < batches.length; i++) {
        console.log('Processing batch', i);
        const batch = batches[i];

        let tx = await Mina.transaction(senderAccount, async () => {
          await zkApp.batchReduce(batch.batch, batch.proof);
        });

        await tx.prove();
        await tx.sign([senderAccount.key]).send();
      }
    };

    await doTest(batchReduce);
  });
});
