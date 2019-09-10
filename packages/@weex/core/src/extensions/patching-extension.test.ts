// The MIT License (MIT)

//   Copyright (c) 2016-3016 Infinite Red, Inc.

//   Permission is hereby granted, free of charge, to any person obtaining a copy
//   of this software and associated documentation files (the "Software"), to deal
//   in the Software without restriction, including without limitation the rights
//   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//   copies of the Software, and to permit persons to whom the Software is
//   furnished to do so, subject to the following conditions:

//   The above copyright notice and this permission notice shall be included in all
//   copies or substantial portions of the Software.

//   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//   SOFTWARE.

import * as expect from 'expect'
import * as jetpack from 'fs-jetpack'
import * as tempWrite from 'temp-write'
import { Toolbox } from '../core/toolbox'
import create from './patching-extension'

const toolbox = new Toolbox()
create(toolbox)
const patching = toolbox.patching

const CONFIG_STRING = `{
  "test": "what???",
  "test2": "never"
}
`

const TEXT_STRING = `These are some words.

They're very amazing.
`

const t = { context: { textFile: null } }

beforeEach(() => {
  t.context.textFile = tempWrite.sync(TEXT_STRING)
})

test('exists - checks a TEXT file for a string', async () => {
  const exists = await patching.exists(t.context.textFile, 'words')
  expect(exists).toBe(true)
})

test('exists - checks a TEXT file for a short form regex', async () => {
  const exists = await patching.exists(t.context.textFile, /ords\b/)
  expect(exists).toBe(true)
})

test('exists - checks a TEXT file for a RegExp', async () => {
  const exists = await patching.exists(t.context.textFile, new RegExp('Word', 'i'))
  expect(exists).toBe(true)
})

test('update - updates a JSON file', async () => {
  const configFile = tempWrite.sync(CONFIG_STRING, '.json')
  const updated = await patching.update(configFile, contents => {
    expect(typeof contents).toBe('object')
    expect(contents.test).toBe('what???')
    expect(contents.test2).toBe('never')

    contents.mutated = true
    return contents
  })

  // returned the updated object
  expect(updated).toBeTruthy()
  expect(updated.mutated).toBe(true)
  expect(updated.test).toBe('what???')
  expect(updated.test2).toBe('never')

  // file was actually written to with the right contents
  const newContents = await jetpack.read(configFile, 'utf8')
  const expectedContents = `{\n  "test": "what???",\n  "test2": "never",\n  "mutated": true\n}`
  expect(newContents).toBe(expectedContents)
})

test('update - updates a text file', async () => {
  const updated = await patching.update(t.context.textFile, contents => {
    expect(contents).toBe(`These are some words.\n\nThey're very amazing.\n`)

    contents = `These are some different words.\nEven more amazing.\n`
    return contents
  })

  // returned the updated object
  expect(updated).toBe(`These are some different words.\nEven more amazing.\n`)

  // file was actually written to with the right contents
  const newContents = await jetpack.read(t.context.textFile, 'utf8')
  const expectedContents = `These are some different words.\nEven more amazing.\n`
  expect(newContents).toBe(expectedContents)
})

test('update - cancel updating a file', async () => {
  const updated = await patching.update(t.context.textFile, contents => {
    return false
  })

  // returned false
  expect(updated).toBe(false)

  // file was not altered
  const newContents = await jetpack.read(t.context.textFile, 'utf8')
  const expectedContents = `These are some words.\n\nThey're very amazing.\n`
  expect(newContents).toBe(expectedContents)
})

test('prepend - prepends a text file', async () => {
  const updated = await patching.prepend(t.context.textFile, 'prepended info\n')

  // returned the updated object
  expect(updated).toBe(`prepended info\nThese are some words.\n\nThey're very amazing.\n`)

  // file was actually written to with the right contents
  const newContents = await jetpack.read(t.context.textFile, 'utf8')
  const expectedContents = `prepended info\nThese are some words.\n\nThey're very amazing.\n`
  expect(newContents).toBe(expectedContents)
})

test('append - appends a text file', async () => {
  const updated = await patching.append(t.context.textFile, 'appended info\n')

  // returned the updated object
  expect(updated).toBe(`These are some words.\n\nThey're very amazing.\nappended info\n`)

  // file was actually written to with the right contents
  const newContents = await jetpack.read(t.context.textFile, 'utf8')
  const expectedContents = `These are some words.\n\nThey're very amazing.\nappended info\n`
  expect(newContents).toBe(expectedContents)
})

test('replace - replaces text in a text file', async () => {
  const updated = await patching.replace(t.context.textFile, 'very amazing', 'replaced info')

  // returned the updated object
  expect(updated).toBe(`These are some words.\n\nThey're replaced info.\n`)

  // file was actually written to with the right contents
  const newContents = await jetpack.read(t.context.textFile, 'utf8')
  const expectedContents = `These are some words.\n\nThey're replaced info.\n`
  expect(newContents).toBe(expectedContents)
})

test('patch - replaces text in a text file', async () => {
  const updated = await patching.patch(t.context.textFile, {
    replace: 'very amazing',
    insert: 'patched info',
  })

  // returned the updated object
  expect(updated).toBe(`These are some words.\n\nThey're patched info.\n`)

  // file was actually written to with the right contents
  const newContents = await jetpack.read(t.context.textFile, 'utf8')
  const expectedContents = `These are some words.\n\nThey're patched info.\n`
  expect(newContents).toBe(expectedContents)
})

test('patch - adds text before other text in a text file', async () => {
  const updated = await patching.patch(t.context.textFile, {
    before: 'very amazing',
    insert: 'patched info ',
  })

  // returned the updated object
  expect(updated).toBe(`These are some words.\n\nThey're patched info very amazing.\n`)

  // file was actually written to with the right contents
  const newContents = await jetpack.read(t.context.textFile, 'utf8')
  const expectedContents = `These are some words.\n\nThey're patched info very amazing.\n`
  expect(newContents).toBe(expectedContents)
})

test('patch - adds text after other text in a text file', async () => {
  const updated = await patching.patch(t.context.textFile, {
    after: 'some words',
    insert: ' patched info',
  })

  // returned the updated object
  expect(updated).toBe(`These are some words patched info.\n\nThey're very amazing.\n`)

  // file was actually written to with the right contents
  const newContents = await jetpack.read(t.context.textFile, 'utf8')
  const expectedContents = `These are some words patched info.\n\nThey're very amazing.\n`
  expect(newContents).toBe(expectedContents)
})

test('patch - deletes text in a text file', async () => {
  const updated = await patching.patch(t.context.textFile, {
    delete: 'some words',
  })

  // returned the updated object
  expect(updated).toBe(`These are .\n\nThey're very amazing.\n`)

  // file was actually written to with the right contents
  const newContents = await jetpack.read(t.context.textFile, 'utf8')
  const expectedContents = `These are .\n\nThey're very amazing.\n`
  expect(newContents).toBe(expectedContents)
})
