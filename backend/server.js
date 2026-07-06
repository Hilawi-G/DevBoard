import express from "express";

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) =>{
    res.send('Hello from express server');
})

app.listen(PORT, () =>{
    console.log(`server is running on port ${PORT}`);
});