import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { searchFacebook } from './utilities.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
import morgan from "morgan";
const app = express();
const port = process.env.PORT || 3000;//

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); //Body-Parser
app.use(morgan("tiny"));

app.get("/query/fbm", (req, res) => {
    const authHeader = req.headers['x-rapidapi-proxy-secret'];
    if (authHeader === "2f139250-16dd-11ef-88a2-1941876877a9") {
    searchFacebook(req.query).then(allPosts => {
        res.json(allPosts);
    }).catch(error => {
        console.error('Error fetching posts:', error);
        res.json();
    });
    } else {
        console.log('Header not found');
        res.status(403).send('Access Denied');
}});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});