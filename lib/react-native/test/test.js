import Piggy from '../lib/src';

console.log(Piggy);

describe('exported methods', () => {
  it('should have all exported methods', () => {
    expect(Piggy.timeline).toBeObject();
    expect(Piggy.timeline.stopwatch).toBeFunction();
    expect(Piggy.timeline.record).toBeFunction();
    expect(Piggy.timeline.report).toBeFunction();
  });
});
