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
    var url = `https://www.facebook.com/marketplace/search/?query=${params.keyword}&exact=false`;
    const browser = await puppeteer.launch({ headless: true }); // set headless to false to see the browser
    const page = await browser.newPage();
    await page.goto(url);
    const closeButtonSelector = 'div[aria-label="Close"][role="button"]';
    await page.waitForSelector(closeButtonSelector);
    await page.click(closeButtonSelector);
    page.setViewport({width: 800, height: 1000});
    
    if (params.location) {
        const locationButtonSelector = 'div[aria-label="San Francisco · 40 mi"][role="button"]';
        await page.waitForSelector(locationButtonSelector);
        await page.click(locationButtonSelector);
        await page.waitForSelector('input[aria-label="Location"]'); // Replace with your specific selector
        await page.focus('input[aria-label="Location"]'); // Focus on the element
        await page.keyboard.press('Backspace'); // Clear any existing value
        await page.type('input[aria-label="Location"]', params.location); // Type the new value
        await wait(1000);
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        if (params.radius){
            const radiusButtonSelector = 'label[aria-label="Radius"]';
            await page.waitForSelector(radiusButtonSelector);
            await page.click(radiusButtonSelector);
            const radiusBox = getRadiusBox(params.radius)
            const radiusBoxSelector = `div[id=":r1u:__${radiusBox}"]`
            await page.waitForSelector(radiusBoxSelector); // Replace with your specific selector
            await page.click(radiusBoxSelector);
        }
        await wait(1000);
        const applyButtonSelector = 'div[aria-label="Apply"][role="button"]';
        await page.waitForSelector(applyButtonSelector);
        await page.click(applyButtonSelector);
    }

    for (let i = 0; i < Math.floor(params.posts/6); i++) {
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('PageDown');
        await wait(450);
    };
    const marketplaceGrid = await page.$('div[aria-label="Collection of Marketplace items"]');
    const posts = await marketplaceGrid.$$('div.x3ct3a4'); // Replace 'div.post-class' with the actual selector for posts
    let postArray = [];

    for (let post of posts) {
        // Query the anchor tag within the post
        const urlTag = await post.$('a'); // Selects the first anchor tag within the post
        const imgTag = await post.$$('img');
        const locTag = await post.$$('span.xuxw1ft');
        const priceTag = await post.$$('span.x1s688f');
        const descTag = await post.$$('span.x1n2onr6');
        if (urlTag && imgTag && locTag && priceTag && descTag) {
            // Extract the href attribute
            const postUrl = await (await urlTag.getProperty('href')).jsonValue();
            const postImg = await (await imgTag[0].getProperty('src')).jsonValue();
            const postPrice = await (await priceTag[0].getProperty('innerText')).jsonValue();
            const postDesc = await (await descTag[0].getProperty('innerText')).jsonValue();
            const postLocation = await (await locTag[0].getProperty('innerText')).jsonValue();
            const postData = {
                url: postUrl,
                img: postImg,
                price: postPrice,
                desc: postDesc,
                loc: postLocation
            }
            postArray.push(postData);
        } else {
            console.log('GET data not found.');
        }
    }
    browser.close();
    console.log(`${params.posts} posts requested for ${params.location}`)
    console.log(`${postArray.length} posts retrieved from ${params.location}!`)
    return postArray;
}