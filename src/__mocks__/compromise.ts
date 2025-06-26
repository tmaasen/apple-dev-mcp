/**
 * Mock for compromise NLP library to avoid dependencies in tests
 */

const mockDoc = {
  topics: jest.fn().mockReturnValue({
    out: jest.fn().mockReturnValue(['design', 'button', 'interface'])
  }),
  nouns: jest.fn().mockReturnValue({
    out: jest.fn().mockReturnValue(['button', 'interface', 'guidelines'])
  }),
  adjectives: jest.fn().mockReturnValue({
    out: jest.fn().mockReturnValue(['interactive', 'accessible', 'intuitive'])
  })
};

const compromise = jest.fn().mockReturnValue(mockDoc);

export default compromise;