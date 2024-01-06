import PromiseWorker from 'promise-worker'

const worker = new Worker('./worker.ts')
const promiseWorker = new PromiseWorker(worker)
const getPrimes = (amount) =>
  promiseWorker.postMessage({
    type: 'getPrimesMessage',
    amount,
  })
export default { getPrimes }
