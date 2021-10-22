function openNewTabThenExitActionPopup (url) {
	const createProperties = {url}
	chrome.tabs.create(createProperties)
	window.close()
}

function submitAFeatureRequest  () {
	openNewTabThenExitActionPopup('https://github.com/moderatemisbehaviour/seshy/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement')
}

function reportABug  () {
	openNewTabThenExitActionPopup('https://github.com/moderatemisbehaviour/seshy/issues?q=is%3Aopen+is%3Aissue+label%3Abug')
}

function seeOpenSourceCredits () {
	window.location.href = '../credits/index.html'
}

function setUp () {
	const submitAFeatureRequestElement = document.getElementById('submit-a-feature-request')
	const reportABugElement = document.getElementById('report-a-bug')
	const seeOpenSourceCreditsElement = document.getElementById('see-open-source-credits')

	submitAFeatureRequestElement.addEventListener('click', submitAFeatureRequest)
	reportABugElement.addEventListener('click', reportABug)
	seeOpenSourceCreditsElement.addEventListener('click', seeOpenSourceCredits)
}

setUp()
