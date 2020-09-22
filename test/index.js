const MONGODB = process.env.MONGODB || 'mongodb://localhost:27017/test'

const _ = require('lodash')
const assert = require('assert')
const Mongolass = require('..')
const Db = Mongolass.Db
const Schema = Mongolass.Schema
const Model = Mongolass.Model
const mongolass = new Mongolass(MONGODB)

describe('index.js', function () {
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

  it('connect', async function () {
    let error
    const db = await mongolass.connect()
    assert.ok(db instanceof Db)

    const db2 = await mongolass.connect()
    assert.ok(db instanceof Db)
    assert.ok(db === db2)

    try {
      await mongolass.connect('mongodb://localhost:27018/test')
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(error.message, 'Already connected to ' + MONGODB + ', please create another connection.')
  })

  // it('connect with auth', async function () {
  //   const mongolass2 = new Mongolass('mongodb://admin:123456@ds247587.mlab.com:47587/mongolass')

  //   const User = mongolass2.model('User')
  //   const name = Date.now()

  //   await User.insert({ name })
  //   const user = await User.findOne({ name })
  //   assert.ok(user)
  //   assert.ok(user._id)
  //   assert.deepStrictEqual(user.name, name)

  //   await mongolass2.disconnect()
  // })

  it('connect failed', async function () {
    let error
    const mongolass2 = new Mongolass('mongodb://localhost:27018/test', {
      connectTimeoutMS: 1000,
      useUnifiedTopology: false
    })
    try {
      await mongolass2.model('User').find()
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(error.name, 'MongoNetworkError')
    assert.deepStrictEqual(!!error.message.match('connect ECONNREFUSED 127.0.0.1:27018'), true)
  })

  it('disconnect', async function () {
    const mongolass2 = new Mongolass()
    await mongolass2.connect(MONGODB)
    await mongolass2.disconnect()
    assert.deepStrictEqual(mongolass2._client, null)
    assert.deepStrictEqual(mongolass2._db, null)

    const mongolass3 = new Mongolass(MONGODB)
    await mongolass3.connect()
    await mongolass3.disconnect()
    assert.deepStrictEqual(mongolass3._client, null)
    assert.deepStrictEqual(mongolass3._db, null)

    const mongolass4 = new Mongolass(MONGODB)
    await mongolass4.disconnect()
  })

  it('schema', async function () {
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

  it('model', async function () {
    let User
    let error
    const UserSchema = mongolass.schema('User', {
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

    const User2 = mongolass.model('User', {
      name: { type: 'string' },
      age: { type: 'number', range: [0, 100] }
    })
    assert.ok(User !== User2)
    assert.ok(User2 instanceof Model)
    assert.ok(User2 === mongolass.model('User'))
    assert.ok(User2._schema._name === 'UserSchema')
  })

  it('plugin', async function () {
    let error
    const User = mongolass.model('User')
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
    const usernames = await User.find().map('_id').idToString()
    assert.deepStrictEqual(usernames[0].length, 24)
    assert.deepStrictEqual(usernames[1].length, 24)
    assert.deepStrictEqual(typeof usernames[0], 'string')
    assert.deepStrictEqual(typeof usernames[1], 'string')
  })

  it('.createCollection & dropCollection & .listCollections', async function () {
    await mongolass.createCollection('test1')
    await mongolass.createCollection('test2')
    let colls = await mongolass.listCollections()
    colls = _.map(colls, 'name')
    assert.ok(_.includes(colls, 'test1'))
    assert.ok(_.includes(colls, 'test2'))

    await mongolass.dropCollection('test1')
    await mongolass.dropCollection('test2')
    colls = await mongolass.listCollections()
    colls = _.map(colls, 'name')
    assert.ok(!_.includes(colls, 'test1'))
    assert.ok(!_.includes(colls, 'test2'))
  })
})
