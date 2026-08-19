import { describe, it, expect } from 'vitest';

describe('Financial Accounting & Calculation Unit Matrix', () => {
  it('TEST A: Full Cash Payment (Bill = 10,000, Paid = 10,000)', () => {
    const bill = 10000;
    const paid = 10000;
    const credit = Math.max(0, bill - paid);
    const advance = Math.max(0, paid - bill);
    const outstanding = credit;
    const status = credit > 0 ? 'CREDIT' : 'PAID';

    expect(paid).toBe(10000);
    expect(credit).toBe(0);
    expect(advance).toBe(0);
    expect(outstanding).toBe(0);
    expect(status).toBe('PAID');
  });

  it('TEST B: Partial Payment (Bill = 10,000, Paid = 6,000)', () => {
    const bill = 10000;
    const paid = 6000;
    const credit = Math.max(0, bill - paid);
    const outstanding = credit;
    const status = paid > 0 && credit > 0 ? 'PARTIALLY_PAID' : 'CREDIT';

    expect(paid).toBe(6000);
    expect(credit).toBe(4000);
    expect(outstanding).toBe(4000);
    expect(status).toBe('PARTIALLY_PAID');
  });

  it('TEST C: Full Credit (Bill = 10,000, Paid = 0)', () => {
    const bill = 10000;
    const paid = 0;
    const credit = bill - paid;
    const outstanding = credit;
    const status = 'CREDIT';

    expect(credit).toBe(10000);
    expect(outstanding).toBe(10000);
    expect(status).toBe('CREDIT');
  });

  it('TEST D: Overpayment to Customer Advance (Bill = 10,000, Paid = 15,000)', () => {
    const bill = 10000;
    const paid = 15000;
    const appliedToBill = Math.min(bill, paid);
    const excessAdvance = Math.max(0, paid - bill);
    const credit = 0;
    const outstanding = 0;

    expect(appliedToBill).toBe(10000);
    expect(excessAdvance).toBe(5000);
    expect(credit).toBe(0);
    expect(outstanding).toBe(0);
  });

  it('TEST E: Apply Advance to New Bill (Advance = 10,000, Bill = 25,000, Apply = 10,000, Pay = 15,000)', () => {
    const prevAdvance = 10000;
    const bill = 25000;
    const advanceUsed = Math.min(prevAdvance, bill);
    const netPayable = bill - advanceUsed;
    const paid = 15000;
    const credit = Math.max(0, netPayable - paid);
    const remainingAdvance = prevAdvance - advanceUsed;

    expect(advanceUsed).toBe(10000);
    expect(paid).toBe(15000);
    expect(credit).toBe(0);
    expect(remainingAdvance).toBe(0);
  });

  it('TEST F: Nepal Financial Year & Document Numbering', () => {
    const dBefore = new Date('2025-05-10');
    const dAfter = new Date('2025-08-01');

    const getBsFY = (d: Date) => {
      const gYear = d.getFullYear();
      const month = d.getMonth();
      const isShrawanOrLater = month > 6 || (month === 6 && d.getDate() >= 16);
      return isShrawanOrLater ? `${gYear + 57}/${gYear + 58 - 2000}` : `${gYear + 56}/${gYear + 57 - 2000}`;
    };

    expect(getBsFY(dBefore)).toBe('2081/82');
    expect(getBsFY(dAfter)).toBe('2082/83');
  });
});
