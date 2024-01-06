import registerPromiseWorker from 'promise-worker/register'

registerPromiseWorker((message) => {
  if (message.type === 'getPrimesMessage') {
    const amount = message.amount

    return JSON.stringify({ result: amount + 100 })
  }

  return null
})
