/*
BEFORE PUBLISHING
- Run the build so that the build folder exists.
- Update the version in the manifest JSON and the package JSON (the latter doesn't actually change anything but I'm OCD).
*/

import chromeWebstoreUpload from 'chrome-webstore-upload'
import fs from 'fs'
import zipdir from 'zip-dir'

const dir = './dist';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

await zipdir('./build', { saveTo: './dist/seshy.zip' });

const store = chromeWebstoreUpload({
	extensionId: 'noeieddjehppejohbbchbcmheecaneac',
	clientId: process.env.SESHY_PUBLISHER_CLIENT_ID,
	refreshToken: process.env.SESHY_PUBLISHER_REFRESH_TOKEN,
})
const token = await store.fetchToken()
const myZipFile = fs.createReadStream('./dist/seshy.zip')
const resource = await store.uploadExisting(myZipFile, token)
console.info('New version uploaded', resource)

await store.publish('default', token)
console.info('New version published')
