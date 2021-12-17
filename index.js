import  express from "express";
import dotenv from "dotenv";
import shortid from "shortid";
import { MongoClient} from "mongodb";

const app = express()
app.use(express.json())
dotenv.config();

const baseUrl = "http://localhost:9000"

const PORT = process.env.PORT;

const MONGO_URL = process.env.MONGO_URL;

async function createConnection(){                           //create a mongodb connection
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    console.log("mongodb connected");
    return client;
}

export const client = await createConnection();  



app.post("/generateUrl",async (req,res) => {
    const { url } = req.body;
    const urlEncoded = shortid.generate();
    const shortenedUrl = `${baseUrl}/${urlEncoded}`;
    let timestamp = new Date(Date.now())
    let date = timestamp.getDate();
    let month = timestamp.getMonth()+1;
    const data = {
        urlFull : url,
        shortenedUrl : shortenedUrl,
        date : date,
        month : month
    }
    const urls = await client.db("b28wd").collection("urls").insertOne(data);

    res.send({ message: "Url created", shortenedUrl : shortenedUrl });
    
})

app.get("/:encodedUrl",async (req,res) => {
    const { encodedUrl } = req.params;
    const urlData = await client.db("b28wd").collection("urls").findOne({ shortenedUrl : `${baseUrl}/${encodedUrl}` });
    const longUrl = await urlData.urlFull;
    res.send({ url : longUrl });
})

app.get("/Display/getAllUrls",async (req,res) => {
    
    const urlData = await client.db("b28wd").collection("urls").find().toArray();
    
    res.send(urlData);
})

app.get("/Display/urlStats",async (req,res) => {

    let timestamp = new Date(Date.now())
    let month = timestamp.getMonth()+1;

    const dateAggegate = await client.db("b28wd").collection("urls").aggregate([
        { 
            $group: 
            { 
                _id :  "$date"  ,
                count : { $sum : 1 }                   //grouping all data by same date and get the count
            } 
        }
    ]).toArray();

    const monthAggregate = await client.db("b28wd").collection("urls").aggregate([
        {
            $match : { "month" : month }       //mathc month with present month to find no. of urls generated this month
        },
        {
            $group : {
                _id : "$month",
                count : { $sum : 1 }
            }
        }
    ]).toArray();

    const body = { dateAggegate,monthAggregate };
 
    res.send(body);
})


app.get("/",(req,res) => {
    res.send("Hello...Welcome to URL shortner App");
})

app.listen(PORT,() => console.log("App started on port 9000"));

