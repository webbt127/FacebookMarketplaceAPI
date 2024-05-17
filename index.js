import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
import morgan from "morgan";
import puppeteer from "puppeteer";
const app = express();
const port = 3000;

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchFacebook(params){
    var url = `https://www.facebook.com/marketplace/search/?query=${params.keyword}&exact=false`;
    const browser = await puppeteer.launch({ headless: false }); // set headless to false to see the browser
    const page = await browser.newPage();
    await page.goto(url);
    const closeButtonSelector = 'div[aria-label="Close"][role="button"]';
    await page.waitForSelector(closeButtonSelector);
    await page.click(closeButtonSelector);
    for (let i = 0; i < 20; i++) {
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
    console.log(postArray.length)
    return postArray;
}

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); //Body-Parser
app.use(morgan("combined"));

app.get("/query/:city/:keyword", (req, res) => {

    searchFacebook(req.params).then(allPosts => {
        res.json(allPosts);
    }).catch(error => {
        console.error('Error fetching posts:', error);
        res.json();
    });
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});