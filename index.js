import  express from "express";
import fs from "fs";
import path from "path";

const app = express()
app.use(express.json())

let timestamp = new Date(Date.now())
let date = timestamp.getDate();
let month = timestamp.getMonth();
let year = timestamp.getFullYear();

let hours = timestamp.getHours();
let minutes = timestamp.getMinutes();
let seconds = timestamp.getSeconds();

const fullDate = `${date}${month+1}${year}`;

const time = `${hours}${minutes}${seconds}`;

app.get("/createFile",(req,res) => {
   
     const { directoryPath } = req.body;
     const __dirname = path.resolve(directoryPath);

    
    fs.writeFile( `${__dirname}/${fullDate}-${time}.txt` ,`${fullDate}${time}`,(err) => {
        if(err){
            console.log(err);
            return;
        }
        else {
            console.log("The file was saved!");
            res.send("File created")
           
        }
    });
   
})

app.get("/getFiles",(req,res) => {

    const { directoryPath } = req.body;
    const __dirname = path.resolve(directoryPath);
    
    fs.readdir(__dirname,(err,files) => {
        if(err) throw err;
        res.send(files);
    })

})


app.listen(9000,() => console.log("App started on port 9000"));

