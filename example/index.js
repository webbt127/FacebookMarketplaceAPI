import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
import morgan from "morgan";
import puppeteer from "puppeteer";
const app = express();
const port = 3000;

async function searchFacebook(params){
    var url = `https://www.facebook.com/marketplace/search/?query=${params.keyword}&exact=false`;
    const browser = await puppeteer.launch({ headless: true }); // set headless to false to see the browser
    const page = await browser.newPage();
    await page.goto(url);
    const marketplaceGrid = await page.$('div[aria-label="Collection of Marketplace items"]');
    const posts = await marketplaceGrid.$$('div.x3ct3a4'); // Replace 'div.post-class' with the actual selector for posts
    let postArray = [];

    for (let post of posts) {
        // Query the anchor tag within the post
        const urlTag = await post.$('a'); // Selects the first anchor tag within the post
        const imgTag = await post.$$('img');
        const locTag = await post.$$('span.xuxw1ft');
        const priceTag = await post.$$('span.x1s688f')
        const descTag = await post.$$('span.x1n2onr6')
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
            console.log('Post data not found.');
        }
    }
    return postArray;
}

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); //Body-Parser
app.use(morgan("combined"));

app.get("/", (req, res) => {
    res.render(__dirname + "/views/index.ejs");
});

app.get("/about", (req, res) => {
    res.render(__dirname + "/views/about.ejs");
});

app.get("/contact", (req, res) => {
    res.render(__dirname + "/views/contact.ejs");
});

app.post("/search", (req, res) => {
    const page = parseInt(req.body.page) || 1;  // Handle current page, default to 1
    const pageSize = 20; // Set a constant number of items per page

    var params = {
        city: req.body.city,
        keyword: req.body.keyword
    };

    searchFacebook(params).then(allPosts => {
        const totalPosts = allPosts.length;
        const totalPages = Math.ceil(totalPosts / pageSize);
        const offset = (page - 1) * pageSize;
        const paginatedPosts = allPosts.slice(offset, offset + pageSize);

        // Send back all necessary data for rendering the page
        res.render(__dirname + "/views/search.ejs", {
            posts: paginatedPosts,
            currentPage: page,
            totalPages: totalPages,
            params: params  // Pass back the search parameters
        });
    }).catch(error => {
        console.error('Error fetching posts:', error);
        res.render(__dirname + "/views/search.ejs", { posts: [] });
    });
});



app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});