const express = require('express')
const app = express()
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require("mongodb").ObjectId;
const fileUpload = require('express-fileupload');

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ffrgt.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }

    }
    next();
}

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




       
        //banner data 

        app.post('/banner', async (req, res) => {
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

        app.delete('/banner/:id' , async(req , res)=>{
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const data = await bannerCollection.deleteOne(query);
            console.log('deleted item ' , data)
            res.json(data);
        })

        app.put('/banner/edit', async(req,res)=>{
        
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
        
        app.put('/numbers/edit', async(req,res)=>{
        
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

        app.get('/welcome' , async(req , res)=>{
            const cursor = welcomeCollection.find({});
            const welcome = await cursor.toArray();
            res.send(welcome)
        })

        //staff management 

        app.post('/staff', async (req, res) => {
            const name = req.body.name;
            const designation = req.body.designation;
            const mobile = req.body.mobile;
            const pic = req.files.image;
            const picData = pic.data;
            const encodedPic = picData.toString('base64');
            const imageBuffer = Buffer.from(encodedPic, 'base64');
            const data = {
                name,
                designation,
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

        app.delete('/staff/:id' , async(req , res)=>{
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const data = await staffCollection.deleteOne(query);
            console.log('deleted item ' , data)
            res.json(data);
        })

        //student Manage 


        app.post('/student', async (req, res) => {
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

        app.delete('/student/:id' , async(req , res)=>{
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



app.get('/', ( req , res)=>{
    res.send('doctorportal connected')
})

app.listen(port , ()=>{
    console.log(`listening at ${port}`)
})