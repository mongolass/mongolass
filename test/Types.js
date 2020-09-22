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
  beforeEach(async function () {
    await User.insertOne({
      uid: '111111111111111111111111',
      string: 111,
      number: '1.2',
      date: '2018-04-13',
      buffer: '123',
      boolean: {},
      mixed: { names: ['tom', 'xp'] }
    })
  })

  afterEach(async function () {
    await User.deleteMany()
  })

  after(async function () {
    await mongolass.disconnect()
  })

  it('ObjectId is invalid', async function () {
    let error
    try {
      await User.insertOne({ uid: '123' })
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(error.message, '($.uid: "123") ✖ (type: ObjectId)')
  })

  it('ObjectId wrong', async function () {
    let error
    try {
      await User.insertOne({ uid: 'haha' })
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(error.message, '($.uid: "haha") ✖ (type: ObjectId)')
  })

  it('ObjectId', async function () {
    const user = await User.findOne({ uid: '111111111111111111111111' })
    assert.ok(typeof user._id === 'object')
    assert.deepStrictEqual(user.uid.toString(), '111111111111111111111111')
  })

  it('String', async function () {
    const user = await User.findOne({ string: 111 })
    assert.deepStrictEqual(user.string, '111')
  })

  it('Number', async function () {
    let user = await User.findOne({ number: 1.2 })
    assert.deepStrictEqual(user.number, 1.2)

    user = await User.findOne({ number: 'haha' })
    assert.deepStrictEqual(user, null)
  })

  it('Date', async function () {
    let user = await User.findOne({ date: '2018-04-13' })
    assert.deepStrictEqual(user.date, new Date('2018-04-13'))

    user = await User.findOne({ date: 'haha' })
    assert.deepStrictEqual(user, null)
  })

  it('Buffer', async function () {
    let user = await User.findOne({ buffer: '123' })
    assert.deepStrictEqual(user.buffer.toString(), '123')

    user = await User.findOne({ buffer: Buffer.from('123') })
    assert.deepStrictEqual(user.buffer.toString(), '123')

    user = await User.findOne({ buffer: 1 })
    assert.deepStrictEqual(user, null)
  })

  it('Boolean', async function () {
    const user = await User.findOne({ boolean: 1 })
    assert.deepStrictEqual(user.boolean, true)
  })

  it('Mixed', async function () {
    const user = await User.findOne({ uid: '111111111111111111111111' })
    assert.deepStrictEqual(user.mixed, { names: ['tom', 'xp'] })
  })
})
