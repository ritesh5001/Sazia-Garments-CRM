import { Schema, model } from 'mongoose';

interface ICounter {
  _id: string; // sequence name, e.g. "invoice"
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = model<ICounter>('Counter', counterSchema);

/** Atomically increment and return the next sequence value for a named counter. */
export async function getNextSequence(name: string): Promise<number> {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

/** Build a zero-padded document number, e.g. ("INV", 7) -> "INV-00007". */
export async function nextDocNumber(name: string, prefix: string, pad = 5): Promise<string> {
  const seq = await getNextSequence(name);
  return `${prefix}-${String(seq).padStart(pad, '0')}`;
}
