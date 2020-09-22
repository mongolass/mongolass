const MONGODB = process.env.MONGODB || 'mongodb://localhost:27017/test'

const assert = require('assert')
const Mongolass = require('..')
const mongolass = new Mongolass(MONGODB)

const User = mongolass.model('User')

describe('plugins.js', function () {
  beforeEach(async function () {
    await mongolass.model('User').insertOne({ name: 'aaa', age: 2 })
    await mongolass.model('User').insertOne({ name: 'bbb', age: 1 })
  })

  afterEach(async function () {
    await mongolass.model('User').deleteMany()
  })

  after(async function () {
    await mongolass.disconnect()
  })

  it('limit', async function () {
    let users = await User.find({ age: { $gte: 0 } }).select({ _id: 0 }).limit(1)
    assert.deepStrictEqual(users, [{ name: 'aaa', age: 2 }])
    users = await User.findOne().select({ _id: 0 }).limit(1)
    assert.deepStrictEqual(users, { name: 'aaa', age: 2 })
  })

  it('sort', async function () {
    let users = await User.find().select({ _id: 0 }).sort({ age: -1 })
    assert.deepStrictEqual(users, [{ name: 'aaa', age: 2 }, { name: 'bbb', age: 1 }])
    users = await User.findOne().select({ _id: 0 }).sort({ age: -1 })
    assert.deepStrictEqual(users, { name: 'aaa', age: 2 })
  })

  it('fields', async function () {
    let users = await User.find().fields({ _id: 0 }).sort({ age: 1 })
    assert.deepStrictEqual(users, [{ name: 'bbb', age: 1 }, { name: 'aaa', age: 2 }])
    users = await User.findOne().fields({ _id: 0 }).sort({ age: 1 })
    assert.deepStrictEqual(users, { name: 'bbb', age: 1 })
  })

  it('skip', async function () {
    let users = await User.find().select({ _id: 0 }).skip(1)
    assert.deepStrictEqual(users, [{ name: 'bbb', age: 1 }])
    users = await User.findOne().select({ _id: 0 }).skip(1)
    assert.deepStrictEqual(users, { name: 'bbb', age: 1 })
  })

  it('hint', async function () {
    await User.ensureIndex({ name: -1 })
    let users = await User.find().select({ _id: 0 }).hint({ name: -1 })
    assert.deepStrictEqual(users, [{ name: 'bbb', age: 1 }, { name: 'aaa', age: 2 }])
    users = await User.findOne().select({ _id: 0 }).hint({ name: -1 })
    assert.deepStrictEqual(users, { name: 'bbb', age: 1 })
    await User.dropIndex('name_-1')
  })
})
