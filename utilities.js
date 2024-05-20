//import puppeteer from "puppeteer";
import { chromium, devices } from 'playwright';

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
    // page.setViewport({width: 800, height: 1000});
    const browser = await chromium.launch( {headless: runHeadless});
    const context = await browser.newContext(devices['iPhone 11']);
    const page = await context.newPage();
    await page.goto(url);
    //await page.locator('div[aria-label="Close"][role="button"]').click();
    
    if (params.location) {
        await page.locator('div[aria-label*="0 mi"][role="button"]').click();
        await page.waitForSelector('input[aria-label="Location"]');
        await page.focus('input[aria-label="Location"]');
        await page.keyboard.press('Backspace');
        await page.locator('input[aria-label="Location"]').fill(params.location);
        await page.waitForSelector('li[id^="jsc"]');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await page.waitForSelector('li[id^="jsc"]', { hidden: true });
        if (params.radius){
            await page.locator('label[aria-label="Radius"]').click();
            const radiusBox = getRadiusBox(params.radius);
            const radiusBoxSelector = `div[id$="${radiusBox}"]`;
            await page.locator(radiusBoxSelector).click();
        }
        const applyButtonSelector = 'div[aria-label="Apply"][role="button"]';
        await page.locator(applyButtonSelector).click();
        await page.waitForSelector('input[aria-label="Location"]', { hidden: true });
    }

    for (let i = 0; i < Math.floor(params.posts/6); i++) {
        await wait(450);
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('PageDown');
    };
    console.log(await page.content())
    const marketplaceGrid = await page.$('body > div > div > div > div > div:nth-of-type(3) > div > div > div > div > div:nth-of-type(2)');
    const posts = await marketplaceGrid.$$('a');
    let postArray = [];
    console.log(posts)

    // for (let post of posts) {
    //     const urlTag = post
    //     const imgTag = await post.$$('img');
    //     const locationTag = await post.$$('span.xuxw1ft');
    //     const priceTag = await post.$$('span.x1s688f');
    //     const titleTag = await post.$$('span.x1n2onr6');
    //     if (urlTag && imgTag) {
    //         const postUrl = await (await urlTag.getProperty('href')).jsonValue();
    //         const postImg = await (await imgTag[0].getProperty('src')).jsonValue();
    //         const postPrice = await (await priceTag[0].getProperty('innerText')).jsonValue();
    //         const postTitle = await (await titleTag[0].getProperty('innerText')).jsonValue();
    //         const postLocation = await (await locationTag[0].getProperty('innerText')).jsonValue();
    //         const postData = {
    //             title: postTitle,
    //             url: postUrl,
    //             img: postImg,
    //             price: postPrice,
    //             location: postLocation
    //         }
    //         postArray.push(postData);
    //     } else {
    //         console.log('GET data not found.');
    //     }
    // }
    // if (runHeadless === true) {browser.close()};
    // console.log(`${postArray.length} posts retrieved from ${params.location}`);
    // console.log(`${postArray.slice(0,params.posts).length} posts returned`);
    // return postArray.slice(0,params.posts);
}