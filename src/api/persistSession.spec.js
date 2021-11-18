import test from 'ava'
import {persistSession} from './index.js'

const windowId = '1'
const bookmarkFolderId = '1'

const exampleDotCom = 'http://example.com/'
const githubDotCom = 'https://github.com/'
const playwrightDotCom = 'https://playwright.dev/'

test.beforeEach(() => {
	chrome.bookmarks.create.resolves({})
	chrome.bookmarks.move.resolves({})
})

test.afterEach(() => {
	chrome.windows.get.flush()
	chrome.bookmarks.getSubTree.flush()
	chrome.bookmarks.create.flush()
	chrome.bookmarks.move.flush()
	chrome.bookmarks.remove.flush()
})

// TODO: Find out how to use sinon in parallely executed tests, see: https://github.com/avajs/ava/issues/1066
test('One new tab creates one new bookmark', async t => {
	chrome.windows.get.withArgs(windowId).resolves({
		id: windowId,
		tabs: [
			{
				index: 0,
				title: 'Example',
				url: exampleDotCom,
			},
			{
				index: 1,
				title: 'GitHub',
				url: githubDotCom,
			},
		],
	})
	chrome.bookmarks.getSubTree.withArgs(bookmarkFolderId).resolves([{
		id: bookmarkFolderId,
		children: [
			{
				index: 0,
				title: 'Example',
				url: exampleDotCom,
			},
		],
	}])

	await persistSession(windowId, bookmarkFolderId)

	t.assert(chrome.bookmarks.create.calledTwice)
	t.deepEqual(chrome.bookmarks.create.secondCall.args, [
		{
			index: 2,
			parentId: '1',
			title: 'GitHub',
			url: 'https://github.com/',
		},
	])
})

test('Two new tabs creates two new bookmarks', async t => {
	chrome.windows.get.withArgs(windowId).resolves({
		id: windowId,
		tabs: [
			{
				index: 0,
				title: 'Example',
				url: exampleDotCom,
			},
			{
				index: 1,
				title: 'GitHub',
				url: githubDotCom,
			},
			{
				index: 2,
				title: 'Playwright',
				url: playwrightDotCom,
			},
		],
	})
	chrome.bookmarks.getSubTree.withArgs(bookmarkFolderId).resolves([{
		id: bookmarkFolderId,
		children: [
			{
				index: 0,
				url: exampleDotCom,
			},
		],
	}])

	await persistSession(windowId, bookmarkFolderId)

	t.assert(chrome.bookmarks.create.calledThrice)
	t.deepEqual(
		chrome.bookmarks.create.secondCall.args, [{
			index: 2,
			parentId: bookmarkFolderId,
			title: 'GitHub',
			url: githubDotCom,
		}],
	)
	t.deepEqual(
		chrome.bookmarks.create.thirdCall.args, [{
			index: 3,
			parentId: bookmarkFolderId,
			title: 'Playwright',
			url: playwrightDotCom,
		}],
	)
})

test('One closed tab removes one bookmark', async t => {
	chrome.windows.get.withArgs(windowId).resolves({
		id: windowId,
		tabs: [
			{
				id: '1',
				index: 0,
				url: exampleDotCom,
			},
		],
	})
	chrome.bookmarks.getSubTree.withArgs(bookmarkFolderId).resolves([{
		id: bookmarkFolderId,
		children: [
			{
				id: '1',
				index: 0,
				url: exampleDotCom,
			},
			{
				id: '2',
				index: 1,
				url: githubDotCom,
			},
		],
	}])

	await persistSession(windowId, bookmarkFolderId)

	t.assert(chrome.bookmarks.remove.calledOnceWith('2'))
})

test('One tab moved moves one bookmark', async t => {
	chrome.windows.get.withArgs(windowId).resolves({
		id: windowId,
		tabs: [
			{
				id: '1',
				index: 0,
				url: exampleDotCom,
			},
			{
				id: '2',
				index: 1,
				url: playwrightDotCom,
			},
			{
				id: '3',
				index: 2,
				url: githubDotCom,
			},
		],
	})
	chrome.bookmarks.getSubTree.withArgs(bookmarkFolderId).resolves([{
		id: bookmarkFolderId,
		children: [
			{
				id: '1',
				index: 0,
				url: exampleDotCom,
			},
			{
				id: '3',
				index: 1,
				url: githubDotCom,
			},
			{
				id: '2',
				index: 2,
				url: playwrightDotCom,
			},
		],
	}])

	await persistSession(windowId, bookmarkFolderId)

	t.deepEqual(chrome.bookmarks.move.args, [
		['1', {index: 1}],
		['3', {index: 3}],
	])
})

test('Creates seshy bookmark with index 0', async t => {
	chrome.windows.get.withArgs(windowId).resolves({
		id: windowId,
		tabs: [
			{
				id: '1',
				index: 0,
				title: 'Example',
				url: exampleDotCom,
			},
			{
				id: '2',
				index: 1,
				title: 'Playwright',
				url: playwrightDotCom,
			},
		],
	})
	chrome.bookmarks.getSubTree.withArgs(bookmarkFolderId).resolves([{
		id: bookmarkFolderId,
		children: [],
	}])

	await persistSession(windowId, bookmarkFolderId)

	t.assert(chrome.bookmarks.create.calledThrice)
	t.like(chrome.bookmarks.create.firstCall.args[0], {
		index: 0,
		url: 'seshy:///',
	})
	t.like(chrome.bookmarks.create.secondCall.args[0], {
		index: 1,
		url: exampleDotCom,
	})
	t.like(chrome.bookmarks.create.thirdCall.args[0], {
		index: 2,
		url: playwrightDotCom,
	})
})

test('Updates seshy bookmark to have index 0 if it doesn\'t already', async t => {
	chrome.windows.get.withArgs(windowId).resolves({
		id: windowId,
		tabs: [
			{
				id: '1',
				index: 0,
				title: 'Example',
				url: exampleDotCom,
			},
			{
				id: '2',
				index: 1,
				title: 'Playwright',
				url: playwrightDotCom,
			},
		],
	})
	chrome.bookmarks.getSubTree.withArgs(bookmarkFolderId).resolves([{
		id: bookmarkFolderId,
		children: [
			{
				id: '1',
				index: 0,
				title: 'Example',
				url: exampleDotCom,
			},
			{
				id: '2',
				index: 1,
				title: 'Playwright',
				url: playwrightDotCom,
			},
			{
				id: '3',
				index: 2,
				title: '.seshy',
				url: 'seshy:///',
			},
		],
	}])

	await persistSession(windowId, bookmarkFolderId)

	t.assert(chrome.bookmarks.create.notCalled)
	t.deepEqual(chrome.bookmarks.move.args, [
		['1', {index: 1}],
		['2', {index: 2}],
		['3', {index: 0}],
	])
})

test('Moving and removing tabs at the same time', async t => {
	chrome.windows.get.withArgs(windowId).resolves({
		id: windowId,
		tabs: [
			{
				id: '1',
				index: 0,
				title: 'Example',
				url: exampleDotCom,
			},
		],
	})
	chrome.bookmarks.getSubTree.withArgs(bookmarkFolderId).resolves([{
		id: bookmarkFolderId,
		children: [
			{
				index: 0,
				title: '.seshy',
				url: 'seshy:///',
			},
			{
				id: '2',
				index: 1,
				title: 'Playwright',
				url: playwrightDotCom,
			},
			{
				id: '3',
				index: 2,
				title: 'GitHub',
				url: githubDotCom,
			},
			{
				id: '1',
				index: 3,
				title: 'Example',
				url: exampleDotCom,
			},
		],
	}])

	await persistSession(windowId, bookmarkFolderId)

	t.deepEqual(chrome.bookmarks.remove.args, [
		['2'],
		['3'],
	])
	t.deepEqual(chrome.bookmarks.move.args, [
		['1', {index: 1}],
	])
})

test('Adding and moving tabs at the same time', async t => {
	chrome.windows.get.withArgs(windowId).resolves({
		id: windowId,
		tabs: [
			{
				id: '2',
				index: 0,
				title: 'Playwright',
				url: playwrightDotCom,
			},
			{
				id: '3',
				index: 1,
				title: 'GitHub',
				url: githubDotCom,
			},
			{
				id: '1',
				index: 2,
				title: 'Example',
				url: exampleDotCom,
			},
		],
	})
	chrome.bookmarks.getSubTree.withArgs(bookmarkFolderId).resolves([{
		id: bookmarkFolderId,
		children: [
			{
				index: 0,
				title: '.seshy',
				url: 'seshy:///',
			},
			{
				id: '1',
				index: 1,
				title: 'Example',
				url: exampleDotCom,
			},
		],
	}])

	await persistSession(windowId, bookmarkFolderId)

	t.deepEqual(chrome.bookmarks.create.args, [
		[
			{
				index: 1,
				parentId: '1',
				title: 'Playwright',
				url: playwrightDotCom,
			},
		],
		[
			{
				index: 2,
				parentId: '1',
				title: 'GitHub',
				url: githubDotCom,
			},
		],
	])
	t.deepEqual(chrome.bookmarks.move.args, [
		['1', {index: 3}],
	])
})

test('Adding a tab with the same URL as another tab', async t => {
	chrome.windows.get.withArgs(windowId).resolves({
		id: windowId,
		tabs: [
			{
				id: '1',
				index: 0,
				title: 'Example',
				url: exampleDotCom,
			},
			{
				id: '2',
				index: 1,
				title: 'Example',
				url: exampleDotCom,
			},
		],
	})
	chrome.bookmarks.getSubTree.withArgs(bookmarkFolderId).resolves([{
		id: bookmarkFolderId,
		children: [
			{
				index: 0,
				title: '.seshy',
				url: 'seshy:///',
			},
			{
				id: '1',
				index: 1,
				title: 'Example',
				url: exampleDotCom,
			},
		],
	}])

	await persistSession(windowId, bookmarkFolderId)

	t.deepEqual(chrome.bookmarks.create.args, [
		[
			{
				index: 2,
				parentId: '1',
				title: 'Example',
				url: exampleDotCom,
			},
		],
	])
})

test('Removing a tab with the same URL as another tab', async t => {
	chrome.windows.get.withArgs(windowId).resolves({
		id: windowId,
		tabs: [
			{
				id: '1',
				index: 0,
				title: 'Example',
				url: exampleDotCom,
			},
		],
	})
	chrome.bookmarks.getSubTree.withArgs(bookmarkFolderId).resolves([{
		id: bookmarkFolderId,
		children: [
			{
				index: 0,
				title: '.seshy',
				url: 'seshy:///',
			},
			{
				id: '1',
				index: 1,
				title: 'Example',
				url: exampleDotCom,
			},
			{
				id: '2',
				index: 2,
				title: 'Example',
				url: exampleDotCom,
			},
		],
	}])

	await persistSession(windowId, bookmarkFolderId)

	t.deepEqual(chrome.bookmarks.remove.args, [
		['2'],
	])
})

test('Moving a tab with the same URL as another tab', async t => {
	chrome.windows.get.withArgs(windowId).resolves({
		id: windowId,
		tabs: [
			{
				id: '1',
				index: 0,
				title: 'Example',
				url: exampleDotCom,
			},
			{
				id: '3',
				index: 1,
				title: 'Playwright',
				url: playwrightDotCom,
			},
			{
				id: '2',
				index: 2,
				title: 'Example',
				url: exampleDotCom,
			},
		],
	})
	chrome.bookmarks.getSubTree.withArgs(bookmarkFolderId).resolves([{
		id: bookmarkFolderId,
		children: [
			{
				index: 0,
				title: '.seshy',
				url: 'seshy:///',
			},
			{
				id: '1',
				index: 1,
				title: 'Example',
				url: exampleDotCom,
			},
			{
				id: '2',
				index: 2,
				title: 'Example',
				url: exampleDotCom,
			},
			{
				id: '3',
				index: 3,
				title: 'Playwright',
				url: playwrightDotCom,
			},
		],
	}])

	await persistSession(windowId, bookmarkFolderId)

	// TODO: This works but could be accomplished with just ['2', {index: 3}].
	t.deepEqual(chrome.bookmarks.move.args, [
		['2', {index: 1}],
		['3', {index: 2}],
	])
})
