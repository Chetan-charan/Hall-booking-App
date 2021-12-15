import  express from "express";
import { MongoClient } from "mongodb";
import dotenv from 'dotenv';
import cors from "cors";



const app = express()

dotenv.config();

const PORT = process.env.PORT;

app.use(express.json())
app.use(cors());   

app.get("/",(req,res) => {

    res.send("Hello");

})

const MONGO_URL = process.env.MONGO_URL;

async function createConnection(){
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    console.log("MongoDb connected");
    return client;
}

const client = await createConnection();

app.get("/rooms", async (req,res) => {

    const rooms = await client.db("b28wd").collection("rooms").find({}).toArray();
    res.send(rooms);
    
})

app.get('/customers', async (req,res) => {
    const customers = await client.db("b28wd").collection("customers").find({}).toArray();
    res.send(customers);
})

app.post('/rooms/add', async (req,res) => {
    const data = req.body;
    const room = await client.db("b28wd").collection("rooms").insertOne(data);
    res.send({ message: "Room created successfully !!" });

})

app.post('/customers/add', async (req,res) => {
    const data = req.body;
    const { room_name,Date,start_time,end_time } = req.body;
    console.log(room_name);

    const room = await client.db("b28wd").collection("rooms").findOne({name: room_name});

    if(room.customers){
        const customersBooked = room.customers; 

    for(var i = 0;i<customersBooked.length;i++){
        let customer = customersBooked[i];
        if(customer.Date === Date){
            const startTime =  customer.start_time;
            const endTime =  customer.end_time;
            const [hhS,mmS] = startTime.split(':');
            const [hhE,mmE] = endTime.split(":");
      
            const [enteredHours,enteredMinutes] = start_time.split(":");
            const [enteredHoursEnd,enteredMinutesEnd] = end_time.split(":");
            
            if(parseInt(enteredHours)==hhE){
                if(enteredMinutes<mmE){
                    res.send({ message: "Booking is not available in this time slot" });
                    return;
                }
            }
            else if(parseInt(enteredHours)==hhS){
                if(parseInt(enteredMinutes)>=mmS){
                    res.send({ message: "Booking is not available in this time slot" });
                    return;
                }
            }
            else if(parseInt(enteredHoursEnd)==hhS){
                if(parseInt(enteredMinutesEnd)>=mmS){
                    res.send({ message: "Booking is not available in this time slot" });
                    return;
                }
            }
            else if(parseInt(enteredHoursEnd)==hhE){
                
                    res.send({ message: "Booking is not available in this time slot" });
                    return;
                
            }
        } 
        
       
    }

    }
    
    const customer = await client.db("b28wd").collection("customers").insertOne(data);

    const result2 = await client.db("b28wd").collection("rooms").findOneAndUpdate({name: room_name}, {$set: { status: "booked"  }});

    const result1 = await client.db("b28wd").collection("rooms").findOneAndUpdate({name: room_name}, {$push: { customers: data  }});

    res.send({ message: "Room booked successfully" });
})






app.listen(PORT,() => console.log("App started on port 9000"));

