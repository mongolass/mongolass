const MONGODB = process.env.MONGODB || 'mongodb://localhost:27017/test'

const _ = require('lodash')
const assert = require('assert')
const Mongolass = require('..')
const Db = Mongolass.Db
const Schema = Mongolass.Schema
const Model = Mongolass.Model
const mongolass = new Mongolass(MONGODB)

describe('index.js', function () {
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

  it('connect', function * () {
    let error
    let db = yield mongolass.connect()
    assert.ok(db instanceof Db)

    let db2 = yield mongolass.connect()
    assert.ok(db instanceof Db)
    assert.ok(db === db2)

    try {
      yield mongolass.connect('mongodb://localhost:27018/test')
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(error.message, 'Already connected to ' + MONGODB + ', please create another connection.')
  })

  // it('connect with auth', function * () {
  //   const mongolass2 = new Mongolass('mongodb://admin:123456@ds247587.mlab.com:47587/mongolass')

  //   const User = mongolass2.model('User')
  //   const name = Date.now()

  //   yield User.insert({ name })
  //   const user = yield User.findOne({ name })
  //   assert.ok(user)
  //   assert.ok(user._id)
  //   assert.deepStrictEqual(user.name, name)

  //   yield mongolass2.disconnect()
  // })

  it('connect failed', function * () {
    let error
    const mongolass2 = new Mongolass('mongodb://localhost:27018/test')
    try {
      yield mongolass2.model('User').find()
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(error.name, 'MongoNetworkError')
    assert.deepStrictEqual(error.message, 'failed to connect to server [localhost:27018] on first connect [MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27018]')
  })

  it('disconnect', function * () {
    let mongolass2 = new Mongolass()
    yield mongolass2.connect(MONGODB)
    yield mongolass2.disconnect()
    assert.deepStrictEqual(mongolass2._client, null)
    assert.deepStrictEqual(mongolass2._db, null)

    let mongolass3 = new Mongolass(MONGODB)
    yield mongolass3.connect()
    yield mongolass3.disconnect()
    assert.deepStrictEqual(mongolass3._client, null)
    assert.deepStrictEqual(mongolass3._db, null)

    let mongolass4 = new Mongolass(MONGODB)
    yield mongolass4.disconnect()
  })

  it('schema', function * () {
    let UserSchema
    let error

    try {
      UserSchema = mongolass.schema({ name: 'string' })
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(error.message, 'Missing schema name')

    try {
      UserSchema = mongolass.schema('User', 'aaa')
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(error.message, 'Wrong schemaJSON for schema: User')

    UserSchema = mongolass.schema('User', {
      name: { type: 'string' },
      age: { type: 'number', range: [0, 100] }
    })
    assert.ok(UserSchema._schema._id)
    assert.ok(UserSchema instanceof Schema)
    assert.ok(UserSchema === mongolass.schema('User'))

    UserSchema = new Schema('User', {
      name: { type: 'string' },
      age: { type: 'number', range: [0, 100] }
    })
    assert.ok(UserSchema._schema._id)
    assert.ok(UserSchema instanceof Schema)

    try {
      UserSchema = mongolass.schema('User2')
    } catch (e) { error = e }
    assert.deepStrictEqual(error.message, 'No schema: User2')
  })

  it('model', function * () {
    let User
    let User2
    let error
    let UserSchema = mongolass.schema('User', {
      name: { type: 'string' },
      age: { type: 'number', range: [0, 100] }
    })

    try {
      User = mongolass.model(UserSchema)
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(error.message, 'Missing model name')

    try {
      User = mongolass.model('User', 'aaa')
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(error.message, 'Wrong schemaJSON for schema: UserSchema')

    User = mongolass.model('User', UserSchema)
    assert.ok(User instanceof Model)
    assert.ok(User === mongolass.model('User'))
    assert.ok(User._schema._name === 'User')

    User2 = mongolass.model('User', {
      name: { type: 'string' },
      age: { type: 'number', range: [0, 100] }
    })
    assert.ok(User !== User2)
    assert.ok(User2 instanceof Model)
    assert.ok(User2 === mongolass.model('User'))
    assert.ok(User2._schema._name === 'UserSchema')
  })

  it('plugin', function * () {
    let error
    let User = mongolass.model('User')
    try {
      mongolass.plugin('map', function (result, key) {
        return result.map(function (item) {
          return item[key]
        })
      })
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(error.message, 'Wrong plugin name or hooks')

    mongolass.plugin('map', {
      afterFind: function (result, key) {
        return result.map(function (item) {
          return item[key]
        })
      }
    })
    mongolass.plugin('idToString', {
      afterFind: function (ids) {
        return ids.map(function (id) {
          return id.toString()
        })
      }
    })
    let usernames = yield User.find().map('_id').idToString()
    assert.deepStrictEqual(usernames[0].length, 24)
    assert.deepStrictEqual(usernames[1].length, 24)
    assert.deepStrictEqual(typeof usernames[0], 'string')
    assert.deepStrictEqual(typeof usernames[1], 'string')
  })

  it('.createCollection & dropCollection & .listCollections', function * () {
    yield mongolass.createCollection('test1')
    yield mongolass.createCollection('test2')
    let colls = yield mongolass.listCollections()
    colls = _.map(colls, 'name')
    assert.ok(_.includes(colls, 'test1'))
    assert.ok(_.includes(colls, 'test2'))

    yield mongolass.dropCollection('test1')
    yield mongolass.dropCollection('test2')
    colls = yield mongolass.listCollections()
    colls = _.map(colls, 'name')
    assert.ok(!_.includes(colls, 'test1'))
    assert.ok(!_.includes(colls, 'test2'))
  })
})
