const MONGODB = process.env.MONGODB || 'mongodb://localhost:27017/test'

const assert = require('assert')
const Mongolass = require('..')
const Schema = Mongolass.Schema
const Types = Mongolass.Types
const mongolass = new Mongolass(MONGODB)

const UserSchema = new Schema('User', {
  uid: { type: Types.ObjectId },
  string: { type: Types.String },
  number: { type: Types.Number },
  date: { type: Types.Date },
  buffer: { type: Types.Buffer },
  boolean: { type: Types.Boolean },
  mixed: { type: Types.Mixed }
})
const User = mongolass.model('User', UserSchema)

describe('Types.js', function () {
  beforeEach(function * () {
    yield User.insertOne({
      uid: '111111111111111111111111',
      string: 111,
      number: '1.2',
      date: '2018-04-13',
      buffer: '123',
      boolean: {},
      mixed: { names: ['tom', 'xp'] }
    })
  })

  afterEach(function * () {
    yield User.deleteMany()
  })

  after(function * () {
    yield mongolass.disconnect()
  })

  it('ObjectId is invalid', function * () {
    let error
    try {
      yield User.insertOne({ uid: '123' })
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(error.message, '($.uid: "123") ✖ (type: ObjectId)')
  })

  it('ObjectId wrong', function * () {
    let error
    try {
      yield User.insertOne({ uid: 'haha' })
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(error.message, '($.uid: "haha") ✖ (type: ObjectId)')
  })

  it('ObjectId', function * () {
    let user = yield User.findOne({ uid: '111111111111111111111111' })
    assert.ok(typeof user._id === 'object')
    assert.deepStrictEqual(user.uid.toString(), '111111111111111111111111')
  })

  it('String', function * () {
    let user = yield User.findOne({ string: 111 })
    assert.deepStrictEqual(user.string, '111')
  })

  it('Number', function * () {
    let user = yield User.findOne({ number: 1.2 })
    assert.deepStrictEqual(user.number, 1.2)

    user = yield User.findOne({ number: 'haha' })
    assert.deepStrictEqual(user, null)
  })

  it('Date', function * () {
    let user = yield User.findOne({ date: '2018-04-13' })
    assert.deepStrictEqual(user.date, new Date('2018-04-13'))

    user = yield User.findOne({ date: 'haha' })
    assert.deepStrictEqual(user, null)
  })

  it('Buffer', function * () {
    let user = yield User.findOne({ buffer: '123' })
    assert.deepStrictEqual(user.buffer.toString(), '123')

    user = yield User.findOne({ buffer: Buffer.from('123') })
    assert.deepStrictEqual(user.buffer.toString(), '123')

    user = yield User.findOne({ buffer: 1 })
    assert.deepStrictEqual(user, null)
  })

  it('Boolean', function * () {
    let user = yield User.findOne({ boolean: 1 })
    assert.deepStrictEqual(user.boolean, true)
  })

  it('Mixed', function * () {
    let user = yield User.findOne({ uid: '111111111111111111111111' })
    assert.deepStrictEqual(user.mixed, { names: ['tom', 'xp'] })
  })
})
