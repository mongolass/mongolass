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
  beforeEach(function * () {
    yield mongolass.model('User').insertOne({ name: 'aaa', age: 2 })
    yield mongolass.model('User').insertOne({ name: 'bbb', age: 1 })
  })

  afterEach(function * () {
    yield mongolass.model('User').deleteMany()
  })

  after(function * () {
    yield mongolass.disconnect()
  })

  it('exec', function * () {
    let error
    let users = yield User.find().select({ _id: 0 }).exec()
    assert.deepStrictEqual(users, [ { name: 'aaa', age: 2 }, { name: 'bbb', age: 1 } ])

    try {
      yield User.find().select({ _id: 0 }).oops().exec()
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
      model: 'User',
      op: 'find',
      args: [ {}, { projection: { _id: 0 } } ],
      pluginName: 'oops',
      pluginArgs: [],
      pluginOp: 'afterFind',
      result: [
        { name: 'aaa', age: 2 },
        { name: 'bbb', age: 1 }
      ]
    })
  })

  it('cursor', function * () {
    let error
    let usersCursor = yield User.find().select({ _id: 0 }).cursor()
    assert.deepStrictEqual(typeof usersCursor.toArray, 'function')
    assert.deepStrictEqual(typeof usersCursor.next, 'function')
    assert.deepStrictEqual(typeof usersCursor.hasNext, 'function')

    try {
      usersCursor = yield User.find(0).select({ _id: 0 }).cursor()
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(_.pick(error, 'name', 'message', 'driver', 'op', 'args', 'model', 'schema'), {
      name: 'MongoError',
      message: 'query selector must be an object',
      driver: true,
      op: 'find',
      args: [ 0, { projection: { _id: 0 } } ],
      model: 'User',
      schema: null
    })
  })

  it('_bindMethod', function * () {
    let error
    try {
      yield User.find({}, { sort: { age: -1 } }, console.log)
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(error.message, 'Not support callback for method: find, please call .exec() or .cursor()')
    try {
      yield User.find({}, { _id: 0 }, { sort: { age: -1 } })
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(error.message, 'Only support this usage: find(query, options)')
  })

  it('_bindGetter', function * () {
    let collName = yield User.collectionName
    assert.deepStrictEqual(collName, 'users')
  })

  it('_bindSetter', function * () {
    let error
    User.hint = { name: 1, age: -1 }
    try {
      yield User.find()
    } catch (e) {
      error = e
    }
    assert.ok(error.message.match(/bad hint/))
  })
})
