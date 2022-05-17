const express = require("express");
const bodyParser = require("body-parser");
const cors = require ("cors");
const SSLCommerzPayment = require('sslcommerz')
require('dotenv').config();
const MongoClient = require("mongodb").MongoClient;
const OjbectId = require ("mongodb").OjbectId;
const {v4:uuidv4} = require('uuid');
const port = process.env.PORT || 8000;

//  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.texip.mongodb.net/randomUsers?retryWrites=true&w=majority`;
// const uri =`mongodb+srv://kamal:kamal12345@cluster0.4t39k.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4t39k.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  
});
// console.log(client);

const app = express();
app.use(cors());
app.use(express.json())
app.use(bodyParser.urlencoded({extended:true}));

app.get("/",(req,res)=> {
res.send("conected to database")
});

async function run (){
  try{
    await client.connect();
    const database = client.db("jarinparlar")
    const serviceCollection = database.collection('service')
    const userCollection = database.collection('user');
    const orderCollection = client.db("paymentSSL").collection("order");
  
//get api 
app.get("/service",async(req,res) => {
 const cursor = serviceCollection.find({})
 const service = await cursor.toArray()
 res.send(service)
})

//post api
app.post("/service",async(req,res) => {
 const service = req.body
 console.log('hit te api',service)
 const result = await serviceCollection.insertOne(service);
 console.log(result)
 res.send(service)
})

app.post("/users", async (req, res) => {
  const user = req.body;
   const result = await userCollection.insertOne(user);
   console.log(result);
   res.json(result)
   
   
 });
 
//update users 

 app.put("/users", async(req,res)=>{

   const user = req.body;
   const filter = {email:user.email};
   const option = {upsert:true};
   const updateDoc = {$set:user};
   const result =  await userCollection.updateOne(filter,updateDoc,option);
   res.json(result);
 })

 //  make admin

 app.put("/users/admin", async (req, res) => {
   const filter = { email: req.body.email };
   const result = await userCollection.find(filter).toArray();
   if (result) {
     const documents = await userCollection.updateOne(filter, {
       $set: { role: "admin" },
     });
     console.log(documents);
   }
   // else {
   //   const role = "admin";
   //   const result3 = await usersCollection.insertOne(req.body.email, {
   //     role: role,
   //   });
   // }

   // console.log(result);
 });

 // check admin or not
 app.get("/checkAdmin/:email", async (req, res) => {
   const result = await userCollection
     .find({ email: req.params.email })
     .toArray();
   // console.log(result);
   res.send(result);
 });

 /// all order
 app.get("/allOrders", async (req, res) => {
   // console.log("hello");
   const result = await orderCollection.find({}).toArray();
   res.send(result);
 });
 /// all Review page
 app.get("/allReview", async (req, res) => {
   // console.log("hello");
   const result = await reviewCollection.find({}).toArray();
   res.send(result);
 });



//         // SSL Commerz API 

app.post('/init/', async(req, res) => {

  console.log(req.body)
  const data = {
      total_amount:req.body.total_amount,
      currency: 'BDT',
      tran_id: uuidv4(),
      payment_Status:'pending',
      success_url: 'http://localhost:8000/success',
      fail_url: 'http://localhost:8000/fail',
      cancel_url: 'http://localhost:8000/cancel',
      ipn_url: 'http://localhost:8000/ipn',
      shipping_method: 'Courier',
      product_name: req.body.product_name,
      product_image: req.body.product_image,
      product_category: 'Electronic',
      product_profile: 'general',
      cus_name: req.body.cus_name,
      cus_email: req.body.cus_email,
      cus_add1: 'Dhaka',
      cus_add2: 'Dhaka',
      cus_city: 'Dhaka',
      cus_state: 'Dhaka',
      cus_postcode: '1000',
      cus_country: 'Bangladesh',
      cus_phone: '01711111111',
      cus_fax: '01711111111',
      ship_name: 'Customer Name',
      ship_add1: 'Dhaka',
      ship_add2: 'Dhaka',
      ship_city: 'Dhaka',
      ship_state: 'Dhaka',
      ship_postcode: 1000,
      ship_country: 'Bangladesh',
      multi_card_name: 'mastercard',
      value_a: 'ref001_A',
      value_b: 'ref002_B',
      value_c: 'ref003_C',
      value_d: 'ref004_D'
  };
  // console.log(data)
  const order = await orderCollection.insertOne(data);
  const sslcommer = new SSLCommerzPayment(process.env.Store_ID, process.env.Store_Password,false) //true for live default false for sandbox
  sslcommer.init(data).then(data => {
      //process the response that got from sslcommerz 
      //https://developer.sslcommerz.com/doc/v4/#returned-parameters
      console.log(data);
     if (data.GatewayPageURL){
       res.json(data.GatewayPageURL)
     }
     else{
       return res.status(400).json({ 
         message:'payment session faild'

         }
       )
     }
       console.log(data)
  });
})

  
  
  


  app.post('/success',async(req,res) =>{
    console.log(req.body)
    // const order = await orderCollection.updateOne({tran_id:req.body.tran_id},{
  
    
    //   $set:{
    //     val_id:req.body.val_id
    //   }
    // })
    res.status(200).redirect('http://localhost:3000/')
  
  })
  app.post('/fail',async(req,res) =>{
    const order = await orderCollection.deleteOne({tran_id:req.body.tran_id})
    console.log(req.body)
    res.status(400).redirect('http://localhost:3000/')
  
  })
  app.post('/cancel',async(req,res) =>{
    console.log(req.body)
    res.status(200).redirect('http://localhost:3000/')
  
  })

}
  


finally {

}
}
run().catch(console.dir);

app.listen(port,(err)=>{
  console.log("Listen post here ",port);
})
