const { simplifyText } = require('../simplify');

describe('Local Simplifier', () => {
  test('replaces hypertension with high blood pressure', async () => {
    const input = "The patient suffers from Hypertension.";
    const result = await simplifyText(input, false); // force local
    expect(result.simplified).toContain("high blood pressure");
    expect(result.simplified.toLowerCase()).toContain("hypertension"); // It puts it in parens or explanation
    expect(result.model).toBe('local');
  });

  test('preserves punctuation and structure', async () => {
    const input = "Hello, world! How are you?";
    const result = await simplifyText(input, false);
    expect(result.simplified).toContain("Hello, world!");
  });
  
  test('adds explanation section', async () => {
      const input = "The patient suffers from Hypertension.";
      const result = await simplifyText(input, false);
      expect(result.simplified).toContain("What this means");
  });
});
