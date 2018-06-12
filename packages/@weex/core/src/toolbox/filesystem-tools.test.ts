import * as expect from 'expect'
import * as path from 'path'
import { contains } from 'ramda'
import { filesystem } from './filesystem-tools'
import { textSpanContainsPosition } from 'typescript';

test('isFile', () => {
  expect(filesystem.isFile(__filename)).toBe(true)
  expect(filesystem.isFile(__dirname)).toBe(false)
})

test('isNotFile', () => {
  expect(filesystem.isNotFile(__filename)).toBe(false)
  expect(filesystem.isNotFile(__dirname)).toBe(true)
})

test('isDirectory', () => {
  expect(filesystem.isDirectory(__dirname)).toBe(true)
  expect(filesystem.isDirectory(__filename)).toBe(false)
})

test('isNotDirectory', () => {
  expect(filesystem.isNotDirectory(__dirname)).toBe(false)
  expect(filesystem.isNotDirectory(__filename)).toBe(true)
})

test('subdirectories', () => {
  const dirs = filesystem.subdirectories(`${__dirname}/..`)
  expect(dirs.length).toBe(8)
  expect(contains(`${__dirname}/../toolbox`, dirs)).toBe(true)
})

test('blank subdirectories', () => {
  expect(filesystem.subdirectories('')).toEqual([])
  expect(filesystem.subdirectories(__filename)).toEqual([])
})

test('relative subdirectories', () => {
  const dirs = filesystem.subdirectories(`${__dirname}/..`, true)
  expect(dirs.length).toBe(8)
  expect(contains(`toolbox`, dirs)).toBe(true)
})

test('filtered subdirectories', () => {
  const dirs = filesystem.subdirectories(`${__dirname}/..`, true, 'to*')
  expect(1).toBe(dirs.length)
  expect(contains(`toolbox`, dirs)).toBe(true)
})

test('isLocalPath', () => {
  const localPath = './test'
  const remotePath = 'https://github.com'
  expect(filesystem.isLocalPath(localPath)).toBe(true)
  expect(filesystem.isLocalPath(remotePath)).toBe(false)
})

test('getAbsolutePath', () => {
  const relativePath = './test'
  const absolutePath = '/User/username'
  expect(filesystem.getAbsolutePath(relativePath)).toBe(path.join(`${process.cwd()}`, relativePath))
  expect(filesystem.getAbsolutePath(absolutePath)).toBe(absolutePath)
})
