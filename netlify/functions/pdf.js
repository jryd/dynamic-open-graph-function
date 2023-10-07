const puppeteer = require("puppeteer");
const chromium = require("@sparticuz/chromium");
const fs = require('fs')

exports.handler = async function (event, context) {
  // Use local Chrome when testing.
  let localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  let executable = fs.existsSync(localChrome) ? localChrome : await chromium.executablePath()

  // Launch Chrome.
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: executable,
    headless: true,
    // The optimum size for OG images.
  })

  let page = await browser.newPage()

  // Read the template HTML off of disk.
  await page.goto(event.queryStringParameters?.url, { waitUntil: 'networkidle0' });

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': 's-maxage=86400',
    },
    body: (await page.pdf({
      margin: { top: '0.4in', right: '0.4in', bottom: '0.4in', left: '0.4in' },
      printBackground: true,
      format: 'A4',
    })).toString('base64'),
    isBase64Encoded: true,
  }
}

function populateTemplate(content, data) {
  // Replace all instances of e.g. `{{ title }}` with the title.
  for (const [key, value] of Object.entries(data)) {
    content = content.replace(new RegExp(`{{ ${key} }}`, 'g'), value)
  }

  return content;
}
