import  express from "express";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const app = express()
app.use(express.json())
dotenv.config();

const PORT = process.env.PORT;

let timestamp = new Date(Date.now())                       //get the current time
let date = timestamp.getDate();                            //get date from current time
let month = timestamp.getMonth();                          //get month
let year = timestamp.getFullYear();

let hours = timestamp.getHours();                          //get hours
let minutes = timestamp.getMinutes();
let seconds = timestamp.getSeconds();

const fullDate = `${date}${month+1}${year}`;                

const time = `${hours}${minutes}${seconds}`;

app.get("/",(req,res) => {
    res.send("Hello...");
})

app.get("/createFile",(req,res) => {
   
     const { directoryPath } = req.body;
     const __dirname = path.resolve(directoryPath);                            //using path module to resolve the directory path where file need to be created

    
    fs.writeFile( `${__dirname}/${fullDate}-${time}.txt` ,`${fullDate}${time}`,(err) => {        //create a new file at the directory with content of time and date
        if(err){
            console.log(err);
            return;
        }
        else {
          
            res.send("File created")                                               //response sent as file created
           
        }
    });
   
})

app.get("/getFiles",(req,res) => {

    const { directoryPath } = req.body;                                           //get the directory path from direcotory body
    const __dirname = path.resolve(directoryPath);                                
    
    fs.readdir(__dirname,(err,files) => {                                         //get all the file names in the directory
        if(err) throw err;
        res.send(files);                                                          //send response of file names in the directory
    })

})


app.listen(PORT,() => console.log("App started on port 9000"));

