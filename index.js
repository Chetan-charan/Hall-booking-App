import  express from "express";
import dotenv from "dotenv";
import shortid from "shortid";
import { MongoClient} from "mongodb";
import cors from "cors";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";

const app = express()
app.use(cors());
app.use(express.json())
dotenv.config();

const baseUrl = "https://serene-cove-64204.herokuapp.com"

const PORT = process.env.PORT;

const MONGO_URL = process.env.MONGO_URL;

async function createConnection(){                           //create a mongodb connection
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    console.log("mongodb connected");
    return client;
}

export const client = await createConnection();  

const auth = (req,res,next) => {
    try{                                                     //try catch given to handle the error
        const token = req.header('x-auth-token');           //x-auth-token is the key, any name can be given   //key value pair should be given in header
        jwt.verify(token, process.env.SECRET_KEY);           //jwt will verify the token
        next();                                              //go to the requested page  
    }catch(err){
        res.status(401).send({error: err.message})            //jwt generates the error message
    }
          
    
    }

app.post("/generateUrl",async (req,res) => {
    const { url } = req.body;
    const urlEncoded = shortid.generate();
    const shortenedUrl = `${baseUrl}/encodedUrl/${urlEncoded}`;
    let timestamp = new Date(Date.now())
    let date = timestamp.getDate();
    let month = timestamp.getMonth()+1;
    const data = {
        urlFull : url,
        shortenedUrl : shortenedUrl,
        date : date,
        month : month,
        clicks : 0
    }
    const urls = await client.db("b28wd").collection("urls").insertOne(data);

    res.send({ message: "Url created", shortenedUrl : shortenedUrl });
    
})

app.get("/encodedUrl/:code",async (req,res) => {
    const { code } = req.params;
    const urlData = await client.db("b28wd").collection("urls").findOne({ shortenedUrl : `${baseUrl}/encodedUrl/${code}` });
    let clicks = urlData.clicks;
    const urlData1 = await client.db("b28wd").collection("urls").findOneAndUpdate({ shortenedUrl : `${baseUrl}/encodedUrl/${code}` }, { $set : { clicks : clicks+1 }});
    const longUrl = await urlData.urlFull;
    res.redirect(longUrl);
})

app.get("/Display/getAllUrls",async (req,res) => {
    
    const urlData = await client.db("b28wd").collection("urls").find().toArray();
    
    res.send(urlData);
})

app.get("/Display/urlStats",auth,async (req,res) => {

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

app.post("/activateAccount", (req, res) => {
    const { token } = req.body;

    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, async function (err, decodedToken) {
            if (err) {
                return res.status(400).json({ message: "Incorrect or expired link. " });
            }
            const userActivate1 = await client.db("b28wd").collection("driveUsers").findOne({ token: token });
            const userActivate = await client.db("b28wd").collection("driveUsers").findOneAndUpdate({ token: token }, { $set: { status: "active" } });
            res.json({ message: "Sign up successful" });


        });
    }

});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const result = await client.db("b28wd").collection("driveUsers").findOneAndUpdate({email: email}, { $unset : {token: 1 } });

    const user = await getUserbyName(email);
    if (!user) { //if user doesnt exis
        res.status(401).send({ message: "Invalid credentials", success: "false" });
        return;
    }
    const storedPassword = user.password;
    if (user.status !== "active") {
        res.send(401).send({ message: "User is not activate !!!", success: "false" });
        return;
    }
    const firstName = user.firstName;
    const lastName = user.lastName;
    const isPasswordMatch = await bcrypt.compare(password, storedPassword);
    if (isPasswordMatch) {
        const token =  jwt.sign({ email, firstName, lastName }, process.env.SECRET_KEY); //id - give a unique value  //issue token only when password is matched
        res.send({ message: "Successfully logged In !!!", token: token }); //use this token in frontend         
    } else {
        res.status(401).send({ message: "Invalid Credentials", success: "false" }); //if password is wrong
    }

});

async function genPassword(password){
    const NO_OF_ROUNDS = 10;
    const salt = await bcrypt.genSalt(NO_OF_ROUNDS);
    const hashedPassword = await bcrypt.hash(password,salt);
    return hashedPassword;
}


 const transporter = nodemailer.createTransport({
    service: "hotmail",
    port: 587,
    secure: false,
    auth: {
      user: "chetanhc1997@hotmail.com",
      pass: process.env.MAIL_PASSWORD, 
    },
  });


 async function createUser(data) {
    return await client.db("b28wd").collection("driveUsers").insertOne(data);
}

 async function getUserbyName(username) {
    return await client.db("b28wd").collection("driveUsers").findOne({ email: username });
}

app.post("/signup", async (req, res) => {

    const { email, firstName, lastName, password } = req.body;

    const user = await getUserbyName(email);
    if (user) {
        res.status(401).send({ message: "User already exists" });
        return;
    }
    if (password.length < 8) {
        res.send({ message: "password must be longer" });
        return; //so that execution stops here and doesnt go furthur
    }
    const hashedPassword = await genPassword(password);



    const token = jwt.sign({ email, firstName, lastName }, process.env.SECRET_KEY, { expiresIn: "20m" });

    const result = await createUser({ email: email, password: hashedPassword, firstName: firstName, lastName: lastName, token: token, status: "inactive" });

    const options = {
        from: "chetanhc1997@hotmail.com",
        to: email,
        subject: "URL Shortener App",
        html: `<a>${process.env.CLIENT_URL}/activate/${token}</a>`
    };

    transporter.sendMail(options, (err, info) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log("Sent: " + info.response);
        res.send({ message: "Email has been sent, kindly activate your account!!" });
    });
});

app.post("/forgotPassword",async (req,res) => {
    const { email } = req.body;
    const userFound = await getUserbyName(email);
    
    if(!userFound){
        res.send({message: "User does not exist !!!"});
        return;
    }
    const firstName = userFound.firstName;
    if(userFound){
        const token = jwt.sign({ email, firstName }, process.env.SECRET_KEY, { expiresIn: "20m" });
        const updateUrl = await client.db("b28wd").collection("driveUsers").findOneAndUpdate({email : email}, { $set: {resetLink : `${process.env.CLIENT_URL}/resetPassword/${token}`}});
        const options = {
            from: "chetanhc1997@hotmail.com",
            to: email,
            subject: "Password Reset Link",
            html: `<a>${process.env.CLIENT_URL}/resetPassword/${token}</a>`
        };
    
        transporter.sendMail(options, (err, info) => {
            if (err) {
                console.log(err);
                return;
            }
            console.log("Sent: " + info.response);
            
            res.send({ message: "Password reset link sent to your mail!!", email: email });
        
    });

}


});


app.post("/resetPassword/:token",async (req,res) => {
    const { token } = req.params;
    const { password,email } = req.body;
    const hashedPassword = await genPassword(password);
    const userbyemail = await getUserbyName(email);
    const user = await client.db("b28wd").collection("driveUsers").findOneAndUpdate({resetLink: `${process.env.CLIENT_URL}/resetPassword/${token}`}, { $set: { password: hashedPassword }} );
    const result = await client.db("b28wd").collection("driveUsers").findOneAndUpdate({email: email}, { $unset : {resetLink: 1 } });
    if(!userbyemail){
        res.send({ message: "Password Reset not done !!"  });
        return;
    }   res.send( { message: "Password Reset successfull !! 😄"  })  

})


