const MONGODB = process.env.MONGODB || 'mongodb://localhost:27017/test'

const assert = require('assert')
const _ = require('lodash')
const Mongolass = require('..')
const Schema = Mongolass.Schema
const ObjectId = Mongolass.ObjectId
const mongolass = new Mongolass(MONGODB)

const UserSchema = new Schema('User', {
  name: { type: 'string', required: true },
  age: { type: 'number', range: [0, 100] },
  refe: { type: Mongolass.Types.ObjectId },
  posts: [{
    title: { type: 'string' },
    comments: [{ type: Mongolass.Types.ObjectId }]
  }]
})
const User = mongolass.model('User', UserSchema)

describe('schema.js', function () {
  beforeEach(function * () {
    yield User.create({
      name: 'aaa',
      age: 2,
      refe: ObjectId('222222222222222222222222'),
      posts: [{
        title: 'aaa',
        comments: [ObjectId('333333333333333333333333')]
      }]
    })
    yield User.create({
      name: 'bbb',
      age: 1,
      refe: ObjectId('111111111111111111111111'),
      posts: [{
        title: 'bbb',
        comments: [ObjectId('444444444444444444444444')]
      }]
    })
  })

  afterEach(function * () {
    yield User.deleteMany()
  })

  after(function * () {
    yield mongolass.disconnect()
  })

  it('.required', function * () {
    const UserSchema = new Schema('User', {
      name: { type: 'string', required: true },
      age: { type: 'number' }
    })
    const User = mongolass.model('User', UserSchema)

    let error
    try {
      yield User.insert({ age: 18 })
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
      validator: 'required',
      path: '$.name',
      actual: undefined,
      expected: { type: 'string', required: true },
      schema: 'User',
      model: 'User',
      op: 'insert',
      args: [ { age: 18 } ],
      pluginName: 'MongolassSchema',
      pluginOp: 'beforeInsert',
      pluginArgs: []
    })
  })

  it('.default', function * () {
    const UserSchema = new Schema('User', {
      name: { type: 'string', required: true },
      age: { type: 'number', default: 18 }
    })
    const User = mongolass.model('User', UserSchema)

    const name = String(Date.now())
    yield User.insert({ name })
    const user = yield User.findOne({ name })
    assert.deepStrictEqual(user.name, name)
    assert.deepStrictEqual(user.age, 18)

    yield User.deleteMany({ name })
  })

  it('No schema name', function * () {
    let error
    try {
      /* eslint no-new: 0 */
      new Schema({
        name: { type: 'string' },
        age: { type: 'number', range: [0, 100] },
        refe: { type: Mongolass.Types.ObjectId },
        posts: [{
          title: { type: 'string' },
          comments: [{ type: Mongolass.Types.ObjectId }]
        }]
      })
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(error.message, 'Schema must have a name')
  })

  it('beforeBulkWrite', function * () {
    let error
    try {
      yield User.bulkWrite([{ insertOne: { document: { name: 1, age: 1 } } }])
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
      validator: 'type',
      actual: 1,
      expected: { type: 'string', required: true },
      path: '$.name',
      schema: 'User',
      model: 'User',
      op: 'bulkWrite',
      args: [ [ { insertOne: { document: { name: 1, age: 1 } } } ] ],
      pluginName: 'MongolassSchema',
      pluginOp: 'beforeBulkWrite',
      pluginArgs: []
    })

    try {
      yield User.bulkWrite([{ updateOne: { filter: { name: 'aaa' }, update: { age: 101 }, upsert: true } }])
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
      validator: 'range',
      actual: 101,
      expected: { type: 'number', range: [ 0, 100 ] },
      path: '$.age',
      schema: 'User',
      model: 'User',
      op: 'bulkWrite',
      args: [ [ { updateOne: { filter: { name: 'aaa' }, update: { age: 101 }, upsert: true } } ] ],
      pluginName: 'MongolassSchema',
      pluginOp: 'beforeBulkWrite',
      pluginArgs: []
    })

    try {
      yield User.bulkWrite([{ updateMany: { filter: { name: 'aaa' }, update: { name: 1 }, upsert: true } }])
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
      validator: 'type',
      actual: 1,
      expected: { type: 'string', required: true },
      path: '$.name',
      schema: 'User',
      model: 'User',
      op: 'bulkWrite',
      args: [ [ { updateMany: { filter: { name: 'aaa' }, update: { name: 1 }, upsert: true } } ] ],
      pluginName: 'MongolassSchema',
      pluginOp: 'beforeBulkWrite',
      pluginArgs: []
    })

    yield User.bulkWrite([{ deleteOne: { filter: { refe: '222222222222222222222222' } } }])
    yield User.bulkWrite([{ deleteMany: { filter: { refe: '111111111111111111111111' } } }])
    yield User.create({
      name: 'aaa',
      age: 2,
      refe: ObjectId('222222222222222222222222'),
      posts: [{
        title: 'aaa',
        comments: [ObjectId('333333333333333333333333')]
      }]
    })
    yield User.create({
      name: 'bbb',
      age: 1,
      refe: ObjectId('111111111111111111111111'),
      posts: [{
        title: 'aaa',
        comments: [ObjectId('444444444444444444444444')]
      }]
    })

    try {
      yield User.bulkWrite([{ replaceOne: { filter: { name: 'aaa' }, replacement: { name: 1, age: 1 }, upsert: true } }])
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
      validator: 'type',
      actual: 1,
      expected: { type: 'string', required: true },
      path: '$.name',
      schema: 'User',
      model: 'User',
      op: 'bulkWrite',
      args:
       [ [ { replaceOne:
              { filter: { name: 'aaa' },
                replacement: { name: 1, age: 1 },
                upsert: true } } ] ],
      pluginName: 'MongolassSchema',
      pluginOp: 'beforeBulkWrite',
      pluginArgs: []
    })
  })

  it('beforeCount', function * () {
    let count = yield User.count({ name: 'aaa' })
    assert.deepStrictEqual(count, 1)

    count = yield User.count({ refe: '111111111111111111111111' })
    assert.deepStrictEqual(count, 1)

    count = yield User.count({ refe: ObjectId('111111111111111111111111') })
    assert.deepStrictEqual(count, 1)
  })

  it('beforeDeleteMany', function * () {
    yield User.deleteMany({ refe: '222222222222222222222222' })

    let count = yield User.count()
    assert.deepStrictEqual(count, 1)
  })

  it('beforeDeleteOne', function * () {
    yield User.deleteOne({ refe: '222222222222222222222222' })

    let count = yield User.count()
    assert.deepStrictEqual(count, 1)
  })

  it('beforeDistinct', function * () {
    let count = yield User.distinct('name')
    assert.deepStrictEqual(count, ['aaa', 'bbb'])

    count = yield User.distinct('name', { refe: '111111111111111111111111' })
    assert.deepStrictEqual(count, ['bbb'])

    count = yield User.distinct('name', { refe: ObjectId('111111111111111111111111') })
    assert.deepStrictEqual(count, ['bbb'])
  })

  describe('beforeFind', function () {
    it('$eq', function * () {
      let docs = yield User
        .find({ refe: { $eq: '111111111111111111111111' } })
        .select({ _id: 0, name: 1 })
      assert.deepStrictEqual(docs, [
        { name: 'bbb' }
      ])
    })

    it('$gt', function * () {
      let docs = yield User
        .find({ 'posts.comments': { $gt: '000000000000000000000000' } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'bbb' },
        { name: 'aaa' }
      ])
      docs = yield User
        .find({ 'posts.comments': { $gt: '333333333333333333333333' } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'bbb' }
      ])
      docs = yield User
        .find({ 'posts.comments': { $gt: '444444444444444444444444' } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [])
    })

    it('$gte', function * () {
      let docs = yield User
        .find({ 'posts.comments': { $gte: '333333333333333333333333' } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'bbb' },
        { name: 'aaa' }
      ])
      docs = yield User
        .find({ 'posts.comments': { $gte: '444444444444444444444444' } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'bbb' }
      ])
      docs = yield User
        .find({ 'posts.comments': { $gte: '555555555555555555555555' } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [])
    })

    it('$lt', function * () {
      let docs = yield User
        .find({ 'posts.comments': { $lt: '333333333333333333333333' } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [])
      docs = yield User
        .find({ 'posts.comments': { $lt: '444444444444444444444444' } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'aaa' }
      ])
      docs = yield User
        .find({ 'posts.comments': { $lt: '555555555555555555555555' } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'bbb' },
        { name: 'aaa' }
      ])
    })

    it('$lte', function * () {
      let docs = yield User
        .find({ 'posts.comments': { $lte: '000000000000000000000000' } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [])
      docs = yield User
        .find({ 'posts.comments': { $lte: '333333333333333333333333' } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'aaa' }
      ])
      docs = yield User
        .find({ 'posts.comments': { $lte: '444444444444444444444444' } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'bbb' },
        { name: 'aaa' }
      ])
    })

    it('$ne', function * () {
      let docs = yield User
        .find({ 'posts.comments': { $ne: '333333333333333333333333' } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'bbb' }
      ])
      docs = yield User
        .find({ 'posts.comments': { $ne: '' } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'bbb' },
        { name: 'aaa' }
      ])
    })

    it('$in', function * () {
      let docs = yield User
        .find({ 'posts.comments': { $in: ['333333333333333333333333', ObjectId('444444444444444444444444')] } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'bbb' },
        { name: 'aaa' }
      ])
      docs = yield User
        .find({ 'posts.comments': { $in: ['333333333333333333333333'] } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'aaa' }
      ])
      docs = yield User
        .find({ 'posts.comments': { $in: ['aaa', 'bbb'] } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [])
    })

    it('$nin', function * () {
      let docs = yield User
        .find({ 'posts.comments': { $nin: ['333333333333333333333333', ObjectId('444444444444444444444444')] } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [])
      docs = yield User
        .find({ 'posts.comments': { $nin: ['333333333333333333333333'] } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'bbb' }
      ])
      docs = yield User
        .find({ 'posts.comments': { $nin: ['aaa', 'bbb'] } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'bbb' },
        { name: 'aaa' }
      ])
    })

    it('$or', function * () {
      let docs = yield User
        .find({
          $or: [
            { name: 'aaa' },
            { 'posts.comments': { $in: ['444444444444444444444444'] } }
          ]
        })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'bbb' },
        { name: 'aaa' }
      ])
      docs = yield User
        .find({
          $or: [
            { name: 'aaa' },
            { 'posts.comments': { $in: ['333333333333333333333333'] } }
          ]
        })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'aaa' }
      ])
    })

    it('$and', function * () {
      let docs = yield User
        .find({
          $and: [
            { name: 'aaa' },
            { 'posts.comments': { $in: ['444444444444444444444444'] } }
          ]
        })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [])
      docs = yield User
        .find({
          $and: [
            { name: 'aaa' },
            { 'posts.comments': { $in: ['444444444444444444444444', '333333333333333333333333'] } }
          ]
        })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'aaa' }
      ])
    })

    it('$not', function * () {
      let docs = yield User
        .find({ 'posts.comments': { $not: { $gte: '444444444444444444444444' } } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'aaa' }
      ])
      docs = yield User
        .find({ 'posts.comments': { $not: { $lt: '333333333333333333333333' } } })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'bbb' },
        { name: 'aaa' }
      ])
    })

    it('$nor', function * () {
      let docs = yield User
        .find({
          $nor: [
            { name: 'aaa' },
            { 'posts.comments': { $in: ['444444444444444444444444'] } }
          ]
        })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [])
      docs = yield User
        .find({
          $nor: [
            { name: 'aaa' },
            { 'posts.comments': { $in: ['333333333333333333333333'] } }
          ]
        })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'bbb' }
      ])
    })

    it('$all', function * () {
      let docs = yield User
        .find({
          'posts.comments': { $all: ['444444444444444444444444'] }
        })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'bbb' }
      ])
      docs = yield User
        .find({
          'posts.comments': { $all: ['444444444444444444444444', '333333333333333333333333'] }
        })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [])
      docs = yield User
        .find({
          'posts.comments': { $all: ['111111111111111111111111'] }
        })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [])
    })

    it('$elemMatch', function * () {
      let docs = yield User
        .find({
          posts: {
            $elemMatch: {
              comments: { $in: ['444444444444444444444444'] }
            }
          }
        })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'bbb' }
      ])
      docs = yield User
        .find({
          posts: {
            $elemMatch: {
              comments: { $in: ['444444444444444444444444', ObjectId('333333333333333333333333')] },
              title: { $in: ['aaa', 'bbb', 'ccc'] }
            }
          }
        })
        .select({ _id: 0, name: 1 })
        .sort({ name: -1 })
      assert.deepStrictEqual(docs, [
        { name: 'bbb' },
        { name: 'aaa' }
      ])
    })

    it('$xxx', function * () {
      let count = yield User.count({ name: { $exists: true } })
      assert.deepStrictEqual(count, 2)

      count = yield User.count({ name: { $exists: true }, refe: '111111111111111111111111' })
      assert.deepStrictEqual(count, 1)

      count = yield User.count({ haha: { $exists: true } })
      assert.deepStrictEqual(count, 0)
    })
  })

  it('beforeFindAndModify', function * () {
    let error
    try {
      yield User.findAndModify({ name: 'aaa' }, { age: 1 }, { age: 101 })
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
      validator: 'range',
      actual: 101,
      expected: { type: 'number', range: [ 0, 100 ] },
      path: '$.age',
      schema: 'User',
      model: 'User',
      op: 'findAndModify',
      args: [ { name: 'aaa' }, { age: 1 }, { age: 101 } ],
      pluginName: 'MongolassSchema',
      pluginOp: 'beforeFindAndModify',
      pluginArgs: []
    })
  })

  it('beforeFindAndRemove', function * () {
    yield User.findAndRemove({ name: 'aaa' })
    yield User.create({
      name: 'aaa',
      age: 2,
      refe: ObjectId('222222222222222222222222'),
      posts: [{
        title: 'aaa',
        comments: [ObjectId('333333333333333333333333')]
      }]
    })

    let count = yield User.count()
    assert.deepStrictEqual(count, 2)
  })

  it('beforeFindOne', function * () {
    let doc = yield User.findOne({ refe: '222222222222222222222222' }).select({ _id: 0, name: 1 })
    assert.deepStrictEqual(doc, { name: 'aaa' })

    doc = yield User.findOne({ refe: ObjectId('222222222222222222222222') }).select({ _id: 0, name: 1 })
    assert.deepStrictEqual(doc, { name: 'aaa' })
  })

  it('beforeFindOneAndDelete', function * () {
    yield User.findOneAndDelete({ refe: '222222222222222222222222' })
    yield User.create({
      name: 'aaa',
      age: 2,
      refe: ObjectId('222222222222222222222222'),
      posts: [{
        title: 'aaa',
        comments: [ObjectId('333333333333333333333333')]
      }]
    })

    let count = yield User.count()
    assert.deepStrictEqual(count, 2)
  })

  it('beforeFindOneAndReplace', function * () {
    let error
    try {
      yield User.findOneAndReplace({ name: 'aaa' }, { name: 1, age: 1 })
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
      validator: 'type',
      actual: 1,
      expected: { type: 'string', required: true },
      path: '$.name',
      schema: 'User',
      model: 'User',
      op: 'findOneAndReplace',
      args: [ { name: 'aaa' }, { name: 1, age: 1 } ],
      pluginName: 'MongolassSchema',
      pluginOp: 'beforeFindOneAndReplace',
      pluginArgs: []
    })
  })

  it('beforeFindOneAndUpdate', function * () {
    let error
    try {
      yield User.findOneAndUpdate({ name: 'aaa' }, { age: 101 })
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
      validator: 'range',
      actual: 101,
      expected: { type: 'number', range: [ 0, 100 ] },
      path: '$.age',
      schema: 'User',
      model: 'User',
      op: 'findOneAndUpdate',
      args: [ { name: 'aaa' }, { age: 101 } ],
      pluginName: 'MongolassSchema',
      pluginOp: 'beforeFindOneAndUpdate',
      pluginArgs: []
    })
  })

  it('beforeInsert', function * () {
    let error
    try {
      yield User.insert({ name: 1, age: 101 })
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
      validator: 'type',
      actual: 1,
      expected: { type: 'string', required: true },
      path: '$.name',
      schema: 'User',
      model: 'User',
      op: 'insert',
      args: [ { name: 1, age: 101 } ],
      pluginName: 'MongolassSchema',
      pluginOp: 'beforeInsert',
      pluginArgs: []
    })
  })

  it('beforeInsertOne', function * () {
    let error
    try {
      yield User.insertOne({ name: 1, age: 101 })
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
      validator: 'type',
      actual: 1,
      expected: { type: 'string', required: true },
      path: '$.name',
      schema: 'User',
      model: 'User',
      op: 'insertOne',
      args: [ { name: 1, age: 101 } ],
      pluginName: 'MongolassSchema',
      pluginOp: 'beforeInsertOne',
      pluginArgs: []
    })
  })

  it('beforeInsertMany', function * () {
    let error
    try {
      yield User.insertMany([{ name: 'ccc', age: 3 }, { name: 'ddd', age: -1 }])
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
      validator: 'range',
      actual: -1,
      expected: { type: 'number', range: [ 0, 100 ] },
      path: '$.age',
      schema: 'User',
      model: 'User',
      op: 'insertMany',
      args: [ [ { name: 'ccc', age: 3 }, { name: 'ddd', age: -1 } ] ],
      pluginName: 'MongolassSchema',
      pluginOp: 'beforeInsertMany',
      pluginArgs: []
    })
  })

  it('beforeRemove', function * () {
    try {
      yield User.remove({ refe: '222222222222222222222222' })

      let count = yield User.count()
      assert.deepStrictEqual(count, 1)
    } catch (e) {
      assert.deepStrictEqual(e.op, 'remove')
      assert.deepStrictEqual(typeof e.args[0].refe, 'object')
      assert.deepStrictEqual(e.args[0].refe.toString(), '222222222222222222222222')
      assert.ok(e.message.match('Cannot convert undefined or null to object'))
    }
  })

  it('beforeReplaceOne', function * () {
    let error
    try {
      yield User.replaceOne({ name: 'aaa' }, { name: 'ddd', age: -1 })
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
      validator: 'range',
      actual: -1,
      expected: { type: 'number', range: [ 0, 100 ] },
      path: '$.age',
      schema: 'User',
      model: 'User',
      op: 'replaceOne',
      args: [ { name: 'aaa' }, { name: 'ddd', age: -1 } ],
      pluginName: 'MongolassSchema',
      pluginOp: 'beforeReplaceOne',
      pluginArgs: []
    })
  })

  it('beforeSave', function * () {
    let error
    try {
      yield User.save({ name: 1, age: 101 })
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
      validator: 'type',
      actual: 1,
      expected: { type: 'string', required: true },
      path: '$.name',
      schema: 'User',
      model: 'User',
      op: 'save',
      args: [ { name: 1, age: 101 } ],
      pluginName: 'MongolassSchema',
      pluginOp: 'beforeSave',
      pluginArgs: []
    })
  })

  describe('beforeUpdate', function () {
    it('update empty doc', function * () {
      const name = String(Date.now())
      yield User.insert({ name, age: 18 })
      let user = yield User.findOne({ name })
      assert.deepStrictEqual(user.name, name)
      assert.deepStrictEqual(user.age, 18)

      yield User.update({ name }, {})
      user = yield User.findOne({ _id: user._id })
      assert.ok(user)
      assert.deepStrictEqual(user.name, undefined)
      assert.deepStrictEqual(user.age, undefined)
    })

    it('update doc no schema defined', function * () {
      const name = String(Date.now())
      let error
      try {
        yield User.update({ name }, { $set: { gender: 'male' } })
      } catch (e) {
        error = e
      }
      assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
        model: 'User',
        op: 'update',
        args: [ { name: name }, { '$set': { gender: 'male' } } ],
        pluginName: 'MongolassSchema',
        pluginOp: 'beforeUpdate',
        pluginArgs: []
      })
    })

    it('update posts array', function * () {
      let error
      const name = String(Date.now())
      yield User.insert({ name })
      let user = yield User.findOne({ name })
      assert.deepStrictEqual(user.name, name)
      assert.deepStrictEqual(user.posts, undefined)

      try {
        yield User.update({ name }, { posts: ['1'] })
      } catch (e) {
        error = e
      }
      assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
        validator: 'type',
        path: '$.posts[]',
        actual: '1',
        expected: [{
          title: { type: 'string' },
          comments: [ { type: Mongolass.Types.ObjectId } ]
        }],
        schema: 'User',
        model: 'User',
        op: 'update',
        args: [ { name: name }, { posts: ['1'] } ],
        pluginName: 'MongolassSchema',
        pluginOp: 'beforeUpdate',
        pluginArgs: []
      })
    })

    it('$inc', function * () {
      let error
      yield User.update({ name: 'bbb' }, { $inc: { age: 1 } })
      let b = yield User.findOne({ name: 'bbb' })
      assert.deepStrictEqual(b.age, 2)

      try {
        yield User.update({ name: 'aaa' }, { $inc: { refe: 1 } })
      } catch (e) {
        error = e
      }
      assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
        validator: 'type',
        actual: 1,
        expected: { type: Mongolass.Types.ObjectId },
        path: '$.refe',
        schema: 'User',
        model: 'User',
        op: 'update',
        args: [ { name: 'aaa' }, { '$inc': { refe: 1 } } ],
        pluginName: 'MongolassSchema',
        pluginOp: 'beforeUpdate',
        pluginArgs: []
      })
    })

    it('$set', function * () {
      let error

      // empty doc
      try {
        yield User.update({ name: 'bbb' }, { $set: {} })
      } catch (e) {
        error = e
      }
      assert.ok(error.message.match(/'\$set' is empty/))

      yield User.update({ name: 'bbb' }, { $set: { age: 3 } })
      let doc = yield User.findOne({ name: 'bbb' })
      assert.deepStrictEqual(doc.age, 3)

      // wrong type
      try {
        yield User.update({ name: 'aaa' }, { $set: { refe: 1 } })
      } catch (e) {
        error = e
      }
      assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
        validator: 'type',
        actual: 1,
        expected: { type: Mongolass.Types.ObjectId },
        path: '$.refe',
        schema: 'User',
        model: 'User',
        op: 'update',
        args: [ { name: 'aaa' }, { '$set': { refe: 1 } } ],
        pluginName: 'MongolassSchema',
        pluginOp: 'beforeUpdate',
        pluginArgs: []
      })

      // wrong array
      try {
        yield User.update({ name: 'aaa' }, { $set: { 'posts.0.comments': ['1'] } })
      } catch (e) {
        error = e
      }
      assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
        validator: 'type',
        path: '$.posts[].comments[]',
        actual: '1',
        expected: [{ type: Mongolass.Types.ObjectId }],
        schema: 'User',
        model: 'User',
        op: 'update',
        args: [ { name: 'aaa' }, { '$set': { 'posts.0.comments': ['1'] } } ],
        pluginName: 'MongolassSchema',
        pluginOp: 'beforeUpdate',
        pluginArgs: []
      })

      yield User.update({ name: 'bbb' }, { $set: { 'posts': [] } })
      yield User.update({ name: 'bbb' }, { $set: { 'posts.0.comments': ['111111111111111111111111'] } })
      doc = yield User.findOne({ name: 'bbb' })
      assert.deepStrictEqual(doc.posts[0].comments.length, 1)
      assert.deepStrictEqual(typeof doc.posts[0].comments[0], 'object')
      assert.deepStrictEqual(doc.posts[0].comments[0].toString(), '111111111111111111111111')

      // nested doc
      try {
        yield User.update({ name: 'bbb' }, { $set: { posts: { title: 1 } } })
      } catch (e) {
        error = e
      }
      assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
        validator: 'type',
        path: '$.posts[].title',
        actual: 1,
        expected: { type: 'string' },
        schema: 'User',
        model: 'User',
        op: 'update',
        args: [ { name: 'bbb' }, { '$set': { posts: { title: 1 } } } ],
        pluginName: 'MongolassSchema',
        pluginOp: 'beforeUpdate',
        pluginArgs: []
      })
    })

    it('$setOnInsert', function * () {
      let error
      yield User.update({ name: 'ccc' }, { $setOnInsert: { age: 3 } }, { upsert: true })
      let doc = yield User.findOne({ name: 'ccc' }).select({ _id: 0 })
      assert.deepStrictEqual(doc, {
        name: 'ccc',
        age: 3
      })
      yield User.deleteOne({ name: 'ccc' })

      try {
        yield User.update({ name: 'aaa' }, { $setOnInsert: { refe: 1 } })
      } catch (e) {
        error = e
      }
      assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
        validator: 'type',
        actual: 1,
        expected: { type: Mongolass.Types.ObjectId },
        path: '$.refe',
        schema: 'User',
        model: 'User',
        op: 'update',
        args: [ { name: 'aaa' }, { '$setOnInsert': { refe: 1 } } ],
        pluginName: 'MongolassSchema',
        pluginOp: 'beforeUpdate',
        pluginArgs: []
      })
    })

    it('$addToSet', function * () {
      let error
      try {
        yield User.update({ name: 'aaa' }, { $addToSet: { 'posts.0.comments': 3 } })
      } catch (e) {
        error = e
      }

      assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
        validator: 'type',
        actual: 3,
        expected: [ { type: Mongolass.Types.ObjectId } ],
        path: '$.posts[].comments[]',
        schema: 'User',
        model: 'User',
        op: 'update',
        args: [ { name: 'aaa' }, { '$addToSet': { 'posts.0.comments': 3 } } ],
        pluginName: 'MongolassSchema',
        pluginOp: 'beforeUpdate',
        pluginArgs: []
      })

      yield User.update({ name: 'aaa' }, { $addToSet: {
        posts: {
          title: 'aaa',
          comments: ['555555555555555555555555']
        }
      } })
      let doc = yield User.findOne({ name: 'aaa' })
      assert.deepStrictEqual(doc.posts[0].title, 'aaa')
      assert.deepStrictEqual(doc.posts[0].comments[0].toString(), '333333333333333333333333')
      assert.deepStrictEqual(doc.posts[1].title, 'aaa')
      assert.deepStrictEqual(doc.posts[1].comments[0].toString(), '555555555555555555555555')

      try {
        yield User.update({ name: 'aaa' }, { $addToSet: {
          posts: {
            title: 'aaa',
            comments: 0
          }
        } })
      } catch (e) {
        error = e
      }
      assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
        validator: 'type',
        actual: 0,
        expected: [ { type: Mongolass.Types.ObjectId } ],
        path: '$.posts[].comments[]',
        schema: 'User',
        model: 'User',
        op: 'update',
        args:
         [ { name: 'aaa' },
           { '$addToSet': { posts: { title: 'aaa', comments: 0 } } } ],
        pluginName: 'MongolassSchema',
        pluginOp: 'beforeUpdate',
        pluginArgs: []
      })
    })

    it('$pull', function * () {
      yield User.update({ name: 'aaa' }, { $addToSet: {
        'posts.0.comments': '555555555555555555555555'
      } })

      let doc = yield User.findOne({ name: 'aaa' })
      assert.deepStrictEqual(doc.posts[0].comments.length, 2)

      yield User.update({ 'posts.comments': '333333333333333333333333' }, { $pull: { 'posts.$.comments': { $in: ['555555555555555555555555'] } } })
      doc = yield User.findOne({ name: 'aaa' })
      assert.deepStrictEqual(doc.posts[0].comments.length, 1)
    })

    it('$pullAll', function * () {
      yield User.update({ name: 'aaa' }, { $addToSet: {
        'posts.0.comments': { $each: ['555555555555555555555555', '666666666666666666666666'] }
      } })
      let doc = yield User.findOne({ name: 'aaa' })
      assert.deepStrictEqual(doc.posts[0].comments.length, 3)

      yield User.update({ 'posts.comments': '333333333333333333333333' }, { $pullAll: { 'posts.$.comments': ['555555555555555555555555', '666666666666666666666666'] } })
      doc = yield User.findOne({ name: 'aaa' })
      assert.deepStrictEqual(doc.posts[0].comments.length, 1)
    })

    it('$push', function * () {
      yield User.update({ name: 'aaa' }, { $push: {
        posts: {
          title: 'bbb',
          comments: ['111111111111111111111111']
        }
      } })
      let doc = yield User.findOne({ name: 'aaa' })
      assert.deepStrictEqual(doc.posts.length, 2)

      yield User.update({ name: 'aaa' }, { $push: {
        'posts.0.comments': { $each: ['333333333333333333333333', '555555555555555555555555', '666666666666666666666666'] }
      } })
      doc = yield User.findOne({ name: 'aaa' })
      assert.deepStrictEqual(doc.posts[0].comments.length, 4)
    })

    it('$xxx', function * () {
      let doc = yield User.findOne({ name: 'aaa' })
      assert.deepStrictEqual(doc.posts[0].comments.length, 1)

      yield User.update({ name: 'aaa' }, { $pop: {
        'posts.0.comments': 1
      } })
      doc = yield User.findOne({ name: 'aaa' })
      assert.deepStrictEqual(doc.posts[0].comments.length, 0)
    })

    it('wrong type', function * () {
      let error
      try {
        yield User.update({ name: 'aaa' }, null)
      } catch (e) {
        error = e
      }
      assert.deepStrictEqual(_.pick(error, 'name', 'message', 'driver', 'op', 'args', 'model', 'schema'), {
        name: 'MongoError',
        message: 'document must be a valid JavaScript object',
        driver: true,
        op: 'update',
        args: [ { name: 'aaa' }, null ],
        model: 'User',
        schema: 'User'
      })

      try {
        yield User.update({ name: 'aaa' }, { age: -1 })
      } catch (e) {
        error = e
      }
      assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
        validator: 'range',
        actual: -1,
        expected: { type: 'number', range: [ 0, 100 ] },
        path: '$.age',
        schema: 'User',
        model: 'User',
        op: 'update',
        args: [ { name: 'aaa' }, { age: -1 } ],
        pluginName: 'MongolassSchema',
        pluginOp: 'beforeUpdate',
        pluginArgs: []
      })

      try {
        yield User.update({ name: 'aaa' }, { $set: { age: -1 } })
      } catch (e) {
        error = e
      }

      assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
        validator: 'range',
        actual: -1,
        expected: { type: 'number', range: [ 0, 100 ] },
        path: '$.age',
        schema: 'User',
        model: 'User',
        op: 'update',
        args: [ { name: 'aaa' }, { '$set': { age: -1 } } ],
        pluginName: 'MongolassSchema',
        pluginOp: 'beforeUpdate',
        pluginArgs: []
      })
    })
  })

  it('beforeUpdateOne', function * () {
    let error
    try {
      yield User.updateOne({ name: 'aaa' }, { age: -1 }, { multi: true })
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
      validator: 'range',
      actual: -1,
      expected: { type: 'number', range: [ 0, 100 ] },
      path: '$.age',
      schema: 'User',
      model: 'User',
      op: 'updateOne',
      args: [ { name: 'aaa' }, { age: -1 }, { multi: true } ],
      pluginName: 'MongolassSchema',
      pluginOp: 'beforeUpdateOne',
      pluginArgs: []
    })
  })

  it('beforeUpdateMany', function * () {
    let error
    try {
      yield User.updateMany({ name: 'aaa' }, { age: -1 })
    } catch (e) {
      error = e
    }
    assert.deepStrictEqual(_.omit(error, 'message', 'stack'), {
      validator: 'range',
      actual: -1,
      expected: { type: 'number', range: [ 0, 100 ] },
      path: '$.age',
      schema: 'User',
      model: 'User',
      op: 'updateMany',
      args: [ { name: 'aaa' }, { age: -1 } ],
      pluginName: 'MongolassSchema',
      pluginOp: 'beforeUpdateMany',
      pluginArgs: []
    })
  })
})
