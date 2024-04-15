// https://maps.googleapis.com/maps/api/distancematrix/xml?origins=$1&destinations=$2&mode=$3&key=$k
// import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

// Optional: If you'd like to use the new headless mode. "shell" is the default.
// NOTE: Because we build the shell binary, this option does not work.
//       However, this option will stay so when we migrate to full chromium it will work.
chromium.setHeadlessMode = true;

// Optional: If you'd like to disable webgl, true is the default.
chromium.setGraphicsMode = false;

// Optional: Load any fonts you need. Open Sans is included by default in AWS Lambda instances

const envkey = process.env.API_KEY

export async function getDistmatrix(origins: string, destinations: string, mode: "driving" | "walking", key: string) {
	const response = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins.replaceAll(" ", "+")}&destinations=${destinations.replaceAll(" ", "+")}&mode=${mode}&key=${key}`,
		{
			method: 'POST'
		})
	if (!response.ok) {
		return null
	}
	const out = await response?.json();
	if (!out) {
		return null
	}
	return out?.rows[0]?.elements[0]
}

export async function getProductNetto(term: string, howMany: number = 30) {
	const a = (async () => {
		// Launch a headless browser
		const browser = await puppeteer.launch({
			args: chromium.args,
			defaultViewport: chromium.defaultViewport,
			executablePath: await chromium.executablePath(),
			headless: chromium.headless,
		});

		// Create a new page
		const page = await browser.newPage();

		// Navigate to the website
		await page.goto(`https://netto.is/?term=${term.replaceAll(' ', '+')}&pageSize=${howMany}`);

		// Wait for the page to fully render
		await page.waitForSelector('span.font-bold.text-20.xl\\:text-22');


		// Get the HTML content after rendering
		const combinedResults = await page.evaluate(() => {
			const spans = document.querySelectorAll('span.font-bold.text-20.xl\\:text-22');
			const divs = document.querySelectorAll('div.overflow-hidden.max-h-80');

			const results = [];
			const minLength = Math.min(spans.length, divs.length);

			for (let i = 0; i < minLength; i++) {
				const titleMatches = divs[i].innerHTML.match(/title="([^"]*)"/g);
				const title = titleMatches ? titleMatches.map(match => {
					const innerMatch = match.match(/"([^"]*)"/);
					return innerMatch ? innerMatch[1] : null;
				}) : [];

				const price = Number.parseInt(spans[i].innerHTML.replaceAll('.', ''));

				results.push({ title: title.filter(v => v).join(', '), price });
			}

			return results;
		});
		await browser.close();
		return combinedResults
	})();
	const skil = (await a)[0]
	return {
		verd: skil.price,
		verslun: 'Netto'
	}
}


export async function getLocationNetto() {
	const a = (async () => {
		// Launch a headless browser
		const browser = await puppeteer.launch({
			args: chromium.args,
			defaultViewport: chromium.defaultViewport,
			executablePath: await chromium.executablePath(),
			headless: chromium.headless,
		});

		// Create a new page
		const page = await browser.newPage();

		// Navigate to the website
		await page.goto(`https://netto.is/netto/verslanir-netto/`);

		await page.waitForSelector('div.md\\:col-span-8.col-span-24');
		const test = await page.$$eval('div.md\\:col-span-8.col-span-24', div => div.map(stak => {
			const stadsetning = stak.innerHTML?.split("Staðsetning:")[1]?.split(" ").splice(1, 2)
			return stadsetning && {
				gata: stadsetning[0],
				numer: Number.parseInt(stadsetning[1]),
				verslun: "Netto"
			}
		}
		))
		await browser.close();
		return test.filter(v => v)
	})();

	return a
}

export async function getLocationKronan() {
	const site = await fetch("https://kronan.is/verslanir");
	const html = await site.text();
	const inputString = html.slice(html.match("address")?.index)
	const pattern = /"address\\":\\"([^"]*?)\\"/g;

	// Use the pattern to search for matches in the input string
	const matches = [...inputString.matchAll(pattern)];

	const addresses = matches.map(match => {
		const stadsetning = match[1].split(" ");
		return stadsetning && {
			gata: stadsetning[0],
			numer: Number.parseInt(stadsetning[1]),
			verslun: "Kronan"
		}

	});
	return addresses || null
}

export async function getProductKronan(term: string) {
	const hlekkur = `https://kronan.is/snjallverslun?q=${term}`
	// const site = await fetch(hlekkur);
	// const html = await site.text();
	// console.log(html)
	const a = (async () => {
		// Launch a headless browser
		const browser = await puppeteer.launch({
			args: chromium.args,
			defaultViewport: chromium.defaultViewport,
			executablePath: await chromium.executablePath(),
			headless: chromium.headless,
		});

		// Create a new page
		const page = await browser.newPage();

		// Navigate to the website
		await page.goto(hlekkur);

		// Wait for the page to fully render
		await page.waitForSelector('p.sc-8a298413-0.sc-8a298413-2.sc-100fd088-17.wufRX.hwxMwS.dCtnFZ');

		const test = await page.$$eval('div.sc-100fd088-7.esLCWs', div => div.map(stak => {
			return stak.innerHTML
		}
		))
		const leit = test.find(stak => stak.includes(term))?.split('>').find(stak => Number.parseFloat(stak) || stak.includes('&nbsp'))
		const verd = leit && Number.parseInt(leit.replaceAll('.', ''))
		await browser.close();
		return verd
	})();
	let verd = await a;
	verd = !Number.isNaN(verd) ? Number(verd) : 0;
	return {
		verd: verd,
		verlsun: 'Kronan'
	}

}