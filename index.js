const express = require('express');
const app = express();
const cors = require('cors')
const SSLCommerzPayment = require('sslcommerz')
require('dotenv').config();
const { MongoClient } = require('mongodb');
const objectId = require("mongodb").objectId;
const { v4: uuidv4 } = require('uuid');
const port = process.env.PORT || 8000

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t8ils.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// console.log(uri)

async function run() {
    // all data collection
    try{
        await client.connect()
        console.log('connected to database')
        const database = client.db('e_shoper')
        const productCollection = database.collection('products')
        const userCollection = database.collection('user')
        const reviewCollection = database.collection('review')
        const orderCollection = client.db("paymentSSL").collection("order");

          // get api
          app.get('/products', async(req, res)=> {
            const cursor = productCollection.find({})
            const products =  await cursor.toArray()
            res.send(products)
        })

         // post api 
         app.post('/products', async(req, res)=> {
            const products = req.body
            console.log('hit the api ' , products)
            const result = await productCollection.insertOne(products)
            console.log(result)
            res.json(result)
        })


        // SSL Commerz API 

        app.post('/init', async(req, res) => {

          // console.log(req.body)
          const data = {
              total_amount:req.body.total_amount,
              currency: 'BDT',
              tran_id: uuidv4(),
              payment_Status:'pending',
              success_url: 'https://powerful-oasis-75511.herokuapp.com/success',
              fail_url: 'https://powerful-oasis-75511.herokuapp.com/fail',
              cancel_url: 'https://powerful-oasis-75511.herokuapp.com/cancel',
              ipn_url: 'https://powerful-oasis-75511.herokuapp.com/ipn',
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
              // console.log(data);
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
          const order = await orderCollection.updateOne({tran_id:req.body.tran_id},{
        
          
            $set:{
              val_id:req.body.val_id
            }
          })
          res.status(200).redirect('https://phero-team-projects.web.app/success')
        
        })
        app.post('/fail',async(req,res) =>{
          const order = await orderCollection.deleteOne({tran_id:req.body.tran_id})
          console.log(req.body)
          res.status(400).redirect('https://phero-team-projects.web.app')
        
        })
        app.post('/cancel',async(req,res) =>{
          console.log(req.body)
          res.status(200).redirect('https://phero-team-projects.web.app')
        
        })






    // user post data 
    app.post('/users', async(req , res) =>{
        const user = req.body
        const result = await userCollection.insertOne(user)
        console.log(result)
        res.json(result)
    })

    app.put('/users', async (req, res) => {
        const user = req.body;
        const filter = {email: user.email};
        const options = { upsert: true };
        const updateDoc = {$set: user};
        const result = await userCollection.updateOne(filter, updateDoc, options)
        res.json(result) 
    })
    app.put('/users/admin' , async (req, res) => {
        const user = req.body;
        console.log('put', user)
        const filter = {email: user.email }; 
        const updateDoc = {$set: {role: 'admin' } };
        const result = await userCollection.updateOne(filter, updateDoc)
        res.json(result)
    })

    app.get('/users/:email', async(req, res)=> {
        const email= req.params.email
        const query = {email: email}
        const user = await userCollection.findOne(query)
        let isAdmin = false;
        if(user?.role === 'admin'){
          isAdmin = true;
        }
        res.json({admin : isAdmin})
      })
      

      // Review post
      app.post('/addReview', async (req,res)=> {
        const review = req.body
        const result = await reviewCollection.insertOne(review)
        res.send(result)
      })
       // review get
       app.get('/addReview', async(req, res)=> {
        const cursor = reviewCollection.find({})
        const result =  await cursor.toArray()
        res.send(result)
    })




    }
    finally{
        // await client.close()
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello e-shoper family!')
  })
  
  app.listen(port, () => {
    console.log(` listening at ${port}`)
  })