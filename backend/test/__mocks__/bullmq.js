const jobs = new Map();
let jobCounter = 0;

const mockJob = (id, data) => ({
  id,
  data,
  returnvalue: null,
  failedReason: null,
  getState: async () => 'waiting',
});

const mockQueue = {
  add: jest.fn(async (name, data, opts) => {
    const id = (opts && opts.jobId) || String(++jobCounter);
    const job = mockJob(id, data);
    jobs.set(id, job);
    return job;
  }),
  getJob: jest.fn(async (id) => jobs.get(id) || null),
  close: jest.fn(async () => {}),
  obliterate: jest.fn(async () => {}),
};

const Queue = jest.fn(() => mockQueue);

const Worker = jest.fn(() => ({
  on: jest.fn(),
  close: jest.fn(async () => {}),
}));

const QueueEvents = jest.fn(() => ({
  on: jest.fn(),
  close: jest.fn(async () => {}),
}));

module.exports = { Queue, Worker, QueueEvents };
