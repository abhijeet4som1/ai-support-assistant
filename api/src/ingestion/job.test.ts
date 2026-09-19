import { describeError } from './job.js';

describe('describeError', () => {
  it('unwraps provider JSON envelopes', () => {
    const err = new Error(
      '{"error":{"code":400,"message":"API key not valid. Please pass a valid API key.","status":"INVALID_ARGUMENT"}}',
    );
    expect(describeError(err)).toBe(
      'API key not valid. Please pass a valid API key. (INVALID_ARGUMENT)',
    );
  });
  it('passes plain messages through and truncates long ones', () => {
    expect(describeError(new Error('quota exceeded'))).toBe('quota exceeded');
    expect(describeError('x'.repeat(600))).toHaveLength(501);
  });
});
