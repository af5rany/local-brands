'use strict';

const JwksClient = jest.fn().mockImplementation(() => ({
  getSigningKey: jest.fn().mockResolvedValue({
    getPublicKey: () => 'mock-public-key',
    rsaPublicKey: 'mock-public-key',
  }),
}));

module.exports = JwksClient;
module.exports.default = JwksClient;
