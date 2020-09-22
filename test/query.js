const MONGODB = process.env.MONGODB || 'mongodb://localhost:27017/test'

const assert = require('assert')
const _ = require('lodash')
const Mongolass = require('..')
const mongolass = new Mongolass(MONGODB)

const User = mongolass.model('User')
User.plugin('oops', {
  afterFind: function () {
    throw new Error('oops')
  }
})

describe('query.js', function () {
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

  it('exec', async function () {
    let error
    const users = await User.find().select({ _id: 0 }).exec()
    assert.deepStrictEqual(users, [{ name: 'aaa', age: 2 }, { name: 'bbb', age: 1 }])

    try {
      await User.find().select({ _id: 0 }).oops().exec()
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
      model: 'User',
      op: 'find',
      args: [{}, { projection: { _id: 0 } }],
      pluginName: 'oops',
      pluginArgs: [],
      pluginOp: 'afterFind',
      result: [
        { name: 'aaa', age: 2 },
        { name: 'bbb', age: 1 }
      ]
    })
  })

  it('cursor', async function () {
    let error
    let usersCursor = await User.find().select({ _id: 0 }).cursor()
    assert.deepStrictEqual(typeof usersCursor.toArray, 'function')
    assert.deepStrictEqual(typeof usersCursor.next, 'function')
    assert.deepStrictEqual(typeof usersCursor.hasNext, 'function')

    try {
      usersCursor = await User.find(0).select({ _id: 0 }).cursor()
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(_.pick(error, 'name', 'message', 'driver', 'op', 'args', 'model', 'schema'), {
      name: 'MongoError',
      message: 'query selector must be an object',
      driver: true,
      op: 'find',
      args: [0, { projection: { _id: 0 } }],
      model: 'User',
      schema: null
    })
  })

  it('_bindMethod', async function () {
    let error
    try {
      await User.find({}, { sort: { age: -1 } }, console.log)
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(error.message, 'Not support callback for method: find, please call .exec() or .cursor()')
    try {
      await User.find({}, { _id: 0 }, { sort: { age: -1 } })
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(error.message, 'Only support this usage: find(query, options)')
  })

  it('_bindGetter', async function () {
    const collName = await User.collectionName
    assert.deepStrictEqual(collName, 'users')
  })

  it('_bindSetter', async function () {
    let error
    User.hint = { name: 1, age: -1 }
    try {
      await User.find()
    } catch (e) {
      error = e
    }
    assert.ok(error.message.match(/bad hint/))
  })
})
