const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { MongoClient } = require('mongodb');
const port = process.env.PORT || 5000

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