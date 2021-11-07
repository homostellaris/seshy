/*
BEFORE PUBLISHING
- Run the build so that the build folder exists.
- Update the version in the manifest JSON and the package JSON (the latter doesn't actually change anything but I'm OCD).
*/

import chromeWebstoreUpload from 'chrome-webstore-upload'
import fs from 'fs'
import zipdir from 'zip-dir'

createDistFolder();
await zipBuildFolder();

const store = chromeWebstoreUpload({
	extensionId: 'noeieddjehppejohbbchbcmheecaneac',
	clientId: process.env.SESHY_PUBLISHER_CLIENT_ID,
	refreshToken: process.env.SESHY_PUBLISHER_REFRESH_TOKEN,
})

try {
	const token = await store.fetchToken()
	await uploadZip(token);
	await publish(token);
} catch (error) {
	console.error(error.message)
	process.exit(1)
}

async function publish (token) {
	let resource
	try {
		resource = await store.publish('default', token);
	} catch (error) {
		throw new Error(error.message + '\n' + error.response.body)
	}
	if (resource.itemError) {
		throw Error('Publish failed: ' + resource.itemError[0].error_detail)
	}
	console.info('New version published');
}

async function uploadZip (token) {
	const seshyZip = fs.createReadStream('./dist/seshy.zip');

	let resource
	try {
		resource = await store.uploadExisting(seshyZip, token);
	} catch (error) {
		throw new Error(error.message + '\n' + error.response.body)
	}
	if (resource.itemError) {
		throw Error('Upload failed: ' + resource.itemError[0].error_detail)
	}
	console.info('New version uploaded');
}

async function zipBuildFolder () {
	await zipdir('./build', { saveTo: './dist/seshy.zip' });
}

function createDistFolder () {
	const dir = './dist';
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
}

