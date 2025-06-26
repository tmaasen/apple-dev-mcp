/**
 * Mock for TensorFlow Universal Sentence Encoder to avoid network dependencies in tests
 */

export const load = jest.fn().mockResolvedValue({
  embed: jest.fn().mockResolvedValue({
    data: jest.fn().mockResolvedValue(new Float32Array(512).fill(0.5)),
    dispose: jest.fn()
  })
});