import {chromium} from 'playwright'

const userDataDir = process.argv[2]
console.log(userDataDir)
const pathToExtension = 'src/'

const browserContext = await chromium.launchPersistentContext(userDataDir,{
  headless: false,
  args: [
    `--disable-extensions-except=${pathToExtension}`,
    `--load-extension=${pathToExtension}`
  ],
});
