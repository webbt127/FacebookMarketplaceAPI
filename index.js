import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { searchFacebook } from './utilities.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
import morgan from "morgan";
const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); //Body-Parser
app.use(morgan("combined"));

//app.get("/query/:city/:keyword", (req, res) => {
app.get("/query/fbm", (req, res) => {
    //searchFacebook(req.params).then(allPosts => {
    searchFacebook(req.query).then(allPosts => {
        res.json(allPosts);
    }).catch(error => {
        console.error('Error fetching posts:', error);
        res.json();
    });
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});