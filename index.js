import  express from "express";
import { MongoClient } from "mongodb";
import dotenv from 'dotenv';
import cors from "cors";



const app = express()                          //create an instance of express

dotenv.config();                               //configure dot env file using dotenv package

const PORT = process.env.PORT;                 

app.use(express.json())                         // to handle all the requests and responses in json format
app.use(cors());                                // allow access to app from anywhere

app.get("/",(req,res) => {

    res.send("Hello");

})

const MONGO_URL = process.env.MONGO_URL;        

async function createConnection(){
    const client = new MongoClient(MONGO_URL);           //create a connection with Mongodb
    await client.connect();
  
    return client;
}

const client = await createConnection();

app.get("/rooms", async (req,res) => {

    const rooms = await client.db("b28wd").collection("rooms").find({}).toArray();             //get all rooms from the collection rooms
    res.send(rooms);
    
})

app.get('/customers', async (req,res) => {
    const customers = await client.db("b28wd").collection("customers").find({}).toArray();    //get all customers from the collection rooms
    res.send(customers);
})

app.post('/rooms/add', async (req,res) => {                                                    //add a new room to the rooms collection
    const data = req.body;
    const room = await client.db("b28wd").collection("rooms").insertOne(data);
    res.send({ message: "Room created successfully !!" });                                     // response sent as room created 

})

app.post('/customers/add', async (req,res) => {                                                // end point to add new customer            
    const data = req.body;
    const { room_name,Date,start_time,end_time } = req.body;                                   // get the details from the request body
  

    const room = await client.db("b28wd").collection("rooms").findOne({name: room_name});       // find room with the name

    if(room.customers){
        const customersBooked = room.customers; 

    for(var i = 0;i<customersBooked.length;i++){                                                // loop to find if the room is already booked in the time slot
        let customer = customersBooked[i];
        if(customer.Date === Date){
            const startTime =  customer.start_time;                                        //get the start time and end time of each customer and compare with the new customer time slot                   
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
    
    const customer = await client.db("b28wd").collection("customers").insertOne(data);              //if booking is open allow the customer to be added

    const result2 = await client.db("b28wd").collection("rooms").findOneAndUpdate({name: room_name}, {$set: { status: "booked"  }});      //set the room status as booked

    const result1 = await client.db("b28wd").collection("rooms").findOneAndUpdate({name: room_name}, {$push: { customers: data  }});      // add the customer data in that particular room document

    res.send({ message: "Room booked successfully" });
})






app.listen(PORT,() => console.log("App started on port 9000"));

