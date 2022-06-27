const express = require('express')
const app = express()
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
require('dotenv').config();
const { MongoClient , ServerApiVersion  } = require('mongodb');
const ObjectId = require("mongodb").ObjectId;
const fileUpload = require('express-fileupload');

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ia79a.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: 'Forbidden access' })
      }
      req.decoded = decoded;
      next();
    });
  }

// //   const contactEmail = nodemailer.createTransport({
// //     service: 'gmail',
// //     auth: {
// //       user: "moviedekhtam24hr@gmail.com",
// //       pass: "movie@321",
// //     },
// //   });
  
// //   contactEmail.verify((error) => {
// //     if (error) {
// //       console.log(error);
// //     } else {
// //       console.log("Ready to Send");
// //     }
// //   });


async function run (){

    try{
        await client.connect();
        const database = client.db('srcnc');
        const coursesCollection = database.collection('courses');
        const bannerCollection = database.collection('banner');
        const numberCollection = database.collection('numbers');
        const welcomeCollection = database.collection('welcomeMassage');
        const staffCollection = database.collection('staff');
        const studentCollection = database.collection('student');
        const userCollection = database.collection('users')


        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
              next();
            }
            else {
              res.status(403).send({ message: 'forbidden' });
            }
          }

          //contact

        //  app.post("/contact", (req, res) => {
        //     const name = req.body.name;
        //     const email = req.body.email;
        //     const message = req.body.message; 
        //     const mail = {
        //       from: name,
        //       to: "moviedekhtam24hr@gmail.com",
        //       subject: "Contact Form Submission",
        //       html: `<p>Name: ${name}</p>
        //              <p>Email: ${email}</p>
        //              <p>Message: ${message}</p>`,
        //     };
        //     contactEmail.sendMail(mail, (error) => {
        //       if (error) {
        //         res.json({ status: "ERROR" });
        //       } else {
        //         res.json({ status: "Message Sent" });
        //       }
        //     });
        //   });

       //user


       app.get('/user', verifyJWT, async (req, res) => {
        const users = await userCollection.find().toArray();
        res.send(users);
      });
  
      app.get('/admin/:email', async (req, res) => {
        const email = req.params.email;
        const user = await userCollection.findOne({ email: email });
        const isAdmin = user.role === 'admin';
        res.send({ admin: isAdmin })
      })
  
      app.put('/user/admin/:email', verifyJWT,verifyAdmin,  async (req, res) => {
        const email = req.params.email;
        const filter = { email: email };
        const updateDoc = {
          $set: { role: 'admin' },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      })
  
      app.put('/user/:email', async (req, res) => {
        const email = req.params.email;
        const user = req.body;
        const filter = { email: email };
        const options = { upsert: true };
        const updateDoc = {
          $set: user,
        };
        const result = await userCollection.updateOne(filter, updateDoc, options);
        const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
        res.send({ result, token });
      });

        //banner data 

        app.post('/banner', verifyJWT, verifyAdmin, async (req, res) => {
            const caption = req.body.caption;
            const pic = req.files.image;
            console.log(pic)
            const picData = pic.data;
            const encodedPic = picData.toString('base64');
            const imageBuffer = Buffer.from(encodedPic, 'base64');
            const data = {
                caption,
                image: imageBuffer
            }
            console.log(imageBuffer)
            const result = await bannerCollection.insertOne(data);
            res.json(result);
        })

        app.get('/banner', async (req, res) => {
            const cursor = bannerCollection.find({});
            const banners = await cursor.toArray();
            res.json(banners);
        });

        app.delete('/banner/:id' , verifyJWT, verifyAdmin, async(req , res)=>{
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const data = await bannerCollection.deleteOne(query);
            console.log('deleted item ' , data)
            res.json(data);
        })

        app.put('/banner/edit', verifyJWT, verifyAdmin, async(req,res)=>{
        
            const id = req.body._id
            const caption = req.body.caption;
     
         
            
            const filter = {_id: ObjectId(id)};
            console.log(filter)
            
            const updateDoc = {$set:  {caption:caption } };
          
            const result = await bannerCollection.updateOne(filter, updateDoc );
            res.json(result)
        }) 

        app.get('/courses' , async(req , res)=>{
            const cursor = coursesCollection.find({});
            const courses = await cursor.toArray();
            res.send(courses)
        })

        
        //college in numbers 
        app.get('/numbers' , async(req , res)=>{
            const cursor = numberCollection.find({});
            const numbers = await cursor.toArray();
            res.send(numbers)
        })
        
        app.put('/numbers/edit', verifyJWT, verifyAdmin, async(req,res)=>{
        
            const id = req.body._id
            const numberTitle = req.body.titles;
            const numbersCount = req.body.numbers;
            
        
            const filter = {_id: ObjectId(id)};
            console.log(filter)
            
            const updateDoc = {$set:  {title:numberTitle, numbers:numbersCount} };
          
            const result = await numberCollection.updateOne(filter, updateDoc );
            console.log(result)
            res.json(result)
        }) 
     //welcome

        app.get('/welcome' , async(req , res)=>{
            const cursor = welcomeCollection.find({});
            const welcome = await cursor.toArray();
            res.send(welcome)
        })


app.put('/welcome/edit', verifyJWT, verifyAdmin, async(req,res)=>{
        
            const id = req.body._id
            const welcomeMassage = req.body.massage;
            const youtubeLink = req.body.youtube;
            
        
            const filter = {_id: ObjectId(id)};
            console.log(filter)
            
            const updateDoc = {$set:  {massage:welcomeMassage, linkYoutube:youtubeLink} };
          
            const result = await welcomeCollection.updateOne(filter, updateDoc );
            console.log(result)
            res.json(result)
        }) 
        //staff management 

        app.post('/staff', verifyJWT,verifyAdmin,  async (req, res) => {
            const name = req.body.name;
            const designation = req.body.designation;
            const categoryStaff = req.body.categoryStaff;

            const mobile = req.body.mobile;
            const pic = req.files.image;
            const picData = pic.data;
            const encodedPic = picData.toString('base64');
            const imageBuffer = Buffer.from(encodedPic, 'base64');
            const data = {
                name,
                designation,
                categoryStaff,
                mobile,
                image: imageBuffer
            }
            const result = await staffCollection.insertOne(data);
            res.json(result);
        })
        app.get('/staff', async (req, res) => {
            const cursor = staffCollection.find({});
            const saffs = await cursor.toArray();
            res.json(saffs);
        });

        app.delete('/staff/:id' , verifyJWT, verifyAdmin, async(req , res)=>{
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const data = await staffCollection.deleteOne(query);
            console.log('deleted item ' , data)
            res.json(data);
        })

        //student Manage 


        app.post('/student', verifyJWT, verifyAdmin, async (req, res) => {
            const name = req.body.name;
            const roll = req.body.roll;
            const sessionStart = req.body.sessionStart;
            const sessionEnd = req.body.sessionEnd;
            const regNo = req.body.regNo;
            const course = req.body.course;
            const category = req.body.category;
            const mobile = req.body.mobile;



            const pic = req.files.image;
            const picData = pic.data;
            const encodedPic = picData.toString('base64');
            const imageBuffer = Buffer.from(encodedPic, 'base64');
            const data = {
                name,
                roll,
            
                regNo,
                category,
                course,
                mobile,
                sessionStart,
                sessionEnd,
                image: imageBuffer
            }
            const result = await studentCollection.insertOne(data);
            res.json(result);
        })
        app.get('/student', async (req, res) => {
            const cursor = studentCollection.find({});
            const saffs = await cursor.toArray();
            res.json(saffs);
        });


        app.get('/student/home', verifyJWT, verifyAdmin, async(req, res) =>{
            console.log('query', req.query);
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);

            const query = {};
            const cursor = studentCollection.find(query);
            let students;
            if(page || size){
                // 0 --> skip: 0 get: 0-10(10): 
                // 1 --> skip: 1*10 get: 11-20(10):
                // 2 --> skip: 2*10 get: 21-30 (10):
                // 3 --> skip: 3*10 get: 21-30 (10):
                students = await cursor.skip(page*size).limit(size).toArray();
            }
            else{
                students = await cursor.toArray();
            }
            
            res.send(students);
        });
        app.get('/studentCount', async(req, res) =>{
            const count = await studentCollection.estimatedDocumentCount();
            res.send({count});
        });


        app.delete('/student/:id' , verifyJWT, verifyAdmin, async(req , res)=>{
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const data = await studentCollection.deleteOne(query);
            console.log('deleted item ' , data)
            res.json(data);
        })

    }
    
    
    
    finally{
        // await client.close();
    }


}

run().catch(console.dir);



// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   console.log('hitting')
//   client.close();
// });

app.get('/', ( req , res)=>{
    res.send('doctorportal connected')
})

app.listen(port , ()=>{
    console.log(`listening at ${port}`)
})