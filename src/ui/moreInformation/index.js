function submitAFeatureRequest  () {
	openNewTabThenExitActionPopup('https://github.com/moderatemisbehaviour/seshy/discussions/categories/ideas')
}

function reportABug  () {
	openNewTabThenExitActionPopup('https://github.com/moderatemisbehaviour/seshy/issues?q=is%3Aopen+is%3Aissue+label%3Abug')
}

function leaveAReview  () {
	openNewTabThenExitActionPopup('https://chrome.google.com/webstore/detail/seshy/noeieddjehppejohbbchbcmheecaneac/related?hl=en-GB')
}

function buyMeABeer  () {
	openNewTabThenExitActionPopup('https://github.com/sponsors/moderatemisbehaviour')
}

function openNewTabThenExitActionPopup (url) {
	const createProperties = {url}
	chrome.tabs.create(createProperties)
	window.close()
}

function setUp () {
	const submitAFeatureRequestElement = document.getElementById('submit-a-feature-request')
	const reportABugElement = document.getElementById('report-a-bug')
	const leaveAReviewElement = document.getElementById('leave-a-review')
	const buyMeABeerElement = document.getElementById('buy-me-a-beer')

	submitAFeatureRequestElement.addEventListener('click', submitAFeatureRequest)
	reportABugElement.addEventListener('click', reportABug)
	leaveAReviewElement.addEventListener('click', leaveAReview)
	buyMeABeerElement.addEventListener('click', buyMeABeer)
}

setUp()
