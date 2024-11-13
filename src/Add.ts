import {
  Field,
  SmartContract,
  state,
  State,
  method,
  Experimental,
  Provable,
} from 'o1js';

const { BatchReducer } = Experimental;

export const batchReducer = new BatchReducer({
  actionType: Field,

  batchSize: 2,
});

class Batch extends batchReducer.Batch {}
class BatchProof extends batchReducer.BatchProof {}

export class Add extends SmartContract {
  @state(Field) totalSum = State<Field>();

  // Batch reducer related
  @state(Field)
  actionState = State(BatchReducer.initialActionState);
  @state(Field)
  actionStack = State(BatchReducer.initialActionStack);

  @method async add(value: Field) {
    value.assertGreaterThan(Field(0));
    batchReducer.dispatch(value);
  }

  @method async batchReduce(batch: Batch, proof: BatchProof) {
    let curTotal = this.totalSum.getAndRequireEquals();
    batchReducer.processBatch({ batch, proof }, (number, isDummy) => {
      curTotal = Provable.if(isDummy, curTotal, curTotal.add(number));
    });

    this.totalSum.set(curTotal);
  }
}
