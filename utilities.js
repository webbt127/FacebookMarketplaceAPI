import puppeteer from "puppeteer";

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRadiusBox(radius) {
    if (radius < 2) {return 0}
    else if (radius < 5) {return 1}
    else if (radius < 10) {return 2}
    else if (radius < 20) {return 3}
    else if (radius < 40) {return 4}
    else if (radius < 60) {return 5}
    else if (radius < 80) {return 6}
    else if (radius < 100) {return 7}
    else if (radius < 250) {return 8}
    else if (radius < 500) {return 9}
    else {return 10}
}

export async function searchFacebook(params){
    var runHeadless = true;
    if (!params.posts) {params.posts = 20};
    console.log(`${params.posts} posts requested for ${params.location}`);
    var url = 'https://www.facebook.com/marketplace/search/?';
    const excludeKeys = new Set(['location', 'radius']);
    Object.keys(params).forEach(key => {
        if (params[key] && !excludeKeys.has(key)) {
            url += `&${key}=${params[key]}`;
        }
    });
    url += `&exact=false`;
    console.log(url);
    const browser = await puppeteer.launch({ headless: runHeadless, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    //const browser = await puppeteer.launch({ headless: runHeadless});
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36');
    await page.goto(url);      
    const closeButtonSelector = 'div[aria-label="Close"][role="button"]';
    //await page.waitForSelector(closeButtonSelector);
    //await page.click(closeButtonSelector);
    page.setViewport({width: 800, height: 1000});
    
    if (params.location) {
        const locationButtonSelector = 'div[aria-label*="0 mi"][role="button"]';
        await page.waitForSelector(locationButtonSelector);
        await page.click(locationButtonSelector);
        await page.waitForSelector('input[aria-label="Location"]');
        await page.focus('input[aria-label="Location"]');
        await page.keyboard.press('Backspace');
        await page.type('input[aria-label="Location"]', params.location);
        await page.waitForSelector('li[id^="jsc"]');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await page.waitForSelector('li[id^="jsc"]', { hidden: true });
        if (params.radius){
            const radiusButtonSelector = 'label[aria-label="Radius"]';
            await page.waitForSelector(radiusButtonSelector);
            await page.click(radiusButtonSelector);
            const radiusBox = getRadiusBox(params.radius);
            const radiusBoxSelector = `div[id$="${radiusBox}"]`;
            await page.waitForSelector(radiusBoxSelector);
            await page.click(radiusBoxSelector);
        }
        const applyButtonSelector = 'div[aria-label="Apply"][role="button"]';
        await page.waitForSelector(applyButtonSelector);
        await page.click(applyButtonSelector);
        await page.waitForSelector('input[aria-label="Location"]', { hidden: true });
    }

    for (let i = 0; i < Math.floor(params.posts/6); i++) {
        await wait(450);
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('PageDown');
    };
    const marketplaceGrid = await page.$$('body > div'); // > div:nth-of-type(3) > div > div > div > div > div:nth-of-type(2)');
    console.log(marketplaceGrid.length)
    const posts = await marketplaceGrid[1].$$('a');
    let postArray = [];

    for (let post of posts) {
        const urlTag = post
        const imgTag = await post.$$('img');
        const locationTag = await post.$$('span.xuxw1ft');
        const priceTag = await post.$$('span.x1s688f');
        const titleTag = await post.$$('span.x1n2onr6');
        if (urlTag && imgTag) {
            const postUrl = await (await urlTag.getProperty('href')).jsonValue();
            const postImg = await (await imgTag[0].getProperty('src')).jsonValue();
            const postPrice = await (await priceTag[0].getProperty('innerText')).jsonValue();
            const postTitle = await (await titleTag[0].getProperty('innerText')).jsonValue();
            const postLocation = await (await locationTag[0].getProperty('innerText')).jsonValue();
            const postData = {
                title: postTitle,
                url: postUrl,
                img: postImg,
                price: postPrice,
                location: postLocation
            }
            postArray.push(postData);
        } else {
            console.log('GET data not found.');
        }
    }
    if (runHeadless === true) {browser.close()};
    console.log(`${postArray.length} posts retrieved from ${params.location}`);
    console.log(`${postArray.slice(0,params.posts).length} posts returned`);
    return postArray.slice(0,params.posts);
}