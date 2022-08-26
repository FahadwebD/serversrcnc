const express = require('express')
const app = express()
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const nodemailer = require("nodemailer");
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
  const contactEmail = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
   
        auth: {
            user: `${process.env.GMAIL_USER}`,
            pass: `${process.env.GMAIL_PASS}`,
          },
   
    
   
  });

  contactEmail.verify((error) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Ready to Send");
    }
  });
async function run (){

    try{
        await client.connect();
        const database = client.db('srcnc');
        const coursesCollection = database.collection('courses');
        const bannerCollection = database.collection('banner');
        const numberCollection = database.collection('numbers');
        const welcomeCollection = database.collection('welcomeMassage');
        const footerCollection = database.collection('footerInfo');
        const staffCollection = database.collection('staff');
        const studentCollection = database.collection('student');
        const userCollection = database.collection('users')
        const noticeCollection = database.collection('notice')
        const eventCollection = database.collection('event')
        const facilitiesCollection = database.collection('facilities')
        const InfoCollection = database.collection('info')
        const AnotherInfoCollection = database.collection('anotherinfo')

        

        const gallaryCollection = database.collection('gallary')

        app.post("/contact", (req, res) => {
            const name = req.body.name;
            const email = req.body.email;
            const mobile = req.body.mobile;

            const subject = req.body.subject
            const message = req.body.message; 
            const mail = {
              from: name,
              to: "srcn.institute@gmail.com",
              subject: `${subject}`,
              html: `<p>Name: ${name}</p><p>Email: ${email}</p><p>Mobile: ${mobile}</p><p>Message: ${message}</p>`,
            };
            contactEmail.sendMail(mail, (error) => {
              if (error) {
                res.json({ status: "ERROR" });
              } else {
                res.json({ status: "Message Sent" });
              }
            });
          });

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
        const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5h' })
        res.send({ result, token });
      });

        //banner data 

        app.post('/banner',  async (req, res) => {
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

        app.delete('/banner/:id' ,  async(req , res)=>{
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const data = await bannerCollection.deleteOne(query);
            console.log('deleted item ' , data)
            res.json(data);
        })

        app.put('/banner/edit',  async(req,res)=>{
        
            const id = req.body._id
            const caption = req.body.caption;
     
          console.log(id)
            
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
            
            console.log(id)
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


app.put('/welcome/edit',  async(req,res)=>{
        
            const id = req.body._id
            const welcomeMassage = req.body.massage;
            const youtubeLink = req.body.linkYoutube;
            
        
            const filter = {_id: ObjectId(id)};
            console.log(filter)
            
            const updateDoc = {$set:  {massage:welcomeMassage, linkYoutube:youtubeLink} };
          
            const result = await welcomeCollection.updateOne(filter, updateDoc );
            console.log(result)
            res.json(result)
        }) 

        /// foooter manage

        app.get('/footerinfo' , async(req , res)=>{
            const cursor = footerCollection.find({});
            const footer = await cursor.toArray();
            res.send(footer)
        })


          app.put('/footerinfo/edit',  async(req,res)=>{
        
            const id = req.body._id
            const info = req.body.info;
            
        
            const filter = {_id: ObjectId(id)};
            console.log(filter)
            
            const updateDoc = {$set:  { info:info} };
          
            const result = await footerCollection.updateOne(filter, updateDoc );
            console.log(result)
            res.json(result)
        }) 
    

        //galrry

        app.post('/gallary',   async (req, res) => {
            const title = req.body.title;
           const category =req.body.category
            const pic = req.files.image;
            const picData = pic.data;
            const encodedPic = picData.toString('base64');
            const imageBuffer = Buffer.from(encodedPic, 'base64');
            const data = {
                title,
                category,
                image: imageBuffer
            }
            const result = await gallaryCollection.insertOne(data);
            res.json(result);
        })
        app.get('/gallary', async (req, res) => {
            const cursor = gallaryCollection.find({});
            const saffs = await cursor.toArray();
            res.json(saffs);
        });
        app.get('/gallary/:c', async (req, res) => {
            const c = req.params.c

            let cursor = {}
            if(c == 'all'){
              cursor = gallaryCollection.find({});
            }
            else{
                const query = { category:c  };
                cursor = gallaryCollection.find(query);
            }
            
            const saffs = await cursor.toArray();
            res.json(saffs);
        });
        app.delete('/gallary/:id' ,  async(req , res)=>{
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const data = await gallaryCollection.deleteOne(query);
            console.log('deleted item ' , data)
            res.json(data);
        })

        app.put('/gallary/edit',  async(req,res)=>{
        
            const id = req.body._id
            const title = req.body.title;
           
        
            const filter = {_id: ObjectId(id)};
            console.log(filter)
            
            const updateDoc = {$set:  { title:title } };
          
            const result = await gallaryCollection.updateOne(filter, updateDoc );
            console.log(result)
            res.json(result)
        }) 
    
        //Notice
        app.post('/notice',   async (req, res) => {
            const headline = req.body.headline;
            const date = req.body.date;
            const notice = req.body.notice;
            const pic = req.files.image;
            const picData = pic.data;
            const encodedPic = picData.toString('base64');
            const imageBuffer = Buffer.from(encodedPic, 'base64');
            const data = {
                headline,
                date,
                notice,
                image: imageBuffer
            }
            const result = await noticeCollection.insertOne(data);
            res.json(result);
        })

        app.get('/notice', async (req, res) => {
            const cursor = noticeCollection.find({});
            const saffs = await cursor.toArray();
            res.json(saffs);
        });
        app.get('/notice/:id', async (req, res) => {
            const query = { _id: ObjectId(req.params.id) }
            
            const notice = await noticeCollection.findOne(query);
      
            res.json(notice);
        });
        
        app.delete('/notice/:id' ,  async(req , res)=>{
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const data = await noticeCollection.deleteOne(query);
            console.log('deleted item ' , data)
            res.json(data);
        })


        app.put('/notice/edit/:id', async(req,res)=>{
        
            const id = req.params.id
            const headline = req.body.headline;
         
            const notice = req.body.notice;
            
            
    
        
            const filter = {_id: ObjectId(id)};
            
            
            const updateDoc = {$set:  {headline:headline, notice:notice} };
          
            const result = await noticeCollection.updateOne(filter, updateDoc );
            console.log(result)
            res.json(result)
        }) 



        //event
        
        app.get('/event', async (req, res) => {
            const cursor = eventCollection.find({});
            const saffs = await cursor.toArray();
            res.json(saffs);
        });

        app.post('/event',   async (req, res) => {
            const headline = req.body.headline;
            const date = req.body.date;
            const description = req.body.description;
            const pic = req.files.image;
            const picData = pic.data;
            const encodedPic = picData.toString('base64');
            const imageBuffer = Buffer.from(encodedPic, 'base64');
            const data = {
                headline,
                date,
                description,
                image: imageBuffer
            }
            const result = await eventCollection.insertOne(data);
            res.json(result);
        })

        app.put('/event/edit', async(req,res)=>{
        
            const id = req.body._id
            const headline = req.body.headline;
            const date = req.body.date;
            const description = req.body.description;
            
            
        
            const filter = {_id: ObjectId(id)};
            
            
            const updateDoc = {$set:  {headline:headline, date:date, description:description} };
          
            const result = await eventCollection.updateOne(filter, updateDoc );
            console.log(result)
            res.json(result)
        })
        app.delete('/event/:id' ,  async(req , res)=>{
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const data = await eventCollection.deleteOne(query);
            console.log('deleted item ' , data)
            res.json(data);
        })
        app.get('/event/:id', async (req, res) => {
            const query = { _id: ObjectId(req.params.id) }
            
            const notice = await eventCollection.findOne(query);
      
            res.json(notice);
        });
        //facilities manage


         app.post('/facilities',   async (req, res) => {
            const headline = req.body.headline;
            const date = req.body.date;
            const facilities = req.body.facilities;
            const pic = req.files.image;
            const picData = pic.data;
            const encodedPic = picData.toString('base64');
            const imageBuffer = Buffer.from(encodedPic, 'base64');
            const data = {
                headline,
                date,
                facilities,
                image: imageBuffer
            }
            const result = await facilitiesCollection.insertOne(data);
            res.json(result);
        })

        app.get('/facilities', async (req, res) => {
            const cursor = facilitiesCollection.find({});
            const saffs = await cursor.toArray();
            res.json(saffs);
        });
        app.get('/facilities/:id', async (req, res) => {

            const query = { _id: ObjectId(req.params.id) }
            
            const notice = await facilitiesCollection.findOne(query);
      
            res.json(notice);
        });
        
        app.delete('/facilities/:id' ,  async(req , res)=>{
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const data = await facilitiesCollection.deleteOne(query);
            console.log('deleted item ' , data)
            res.json(data);
        })


        app.put('/facilities/edit/:id', async(req,res)=>{
        
            const id = req.params.id
            const headline = req.body.headline;
         
            const facilities = req.body.facilities;
            
            
    
        
            const filter = {_id: ObjectId(id)};
            
            
            const updateDoc = {$set:  {headline:headline, facilities:facilities} };
          
            const result = await facilitiesCollection.updateOne(filter, updateDoc );
            console.log(result)
            res.json(result)
        }) 


        //staff management 

        app.post('/staff',   async (req, res) => {

            console.log('hit')
            const name = req.body.name;
            const designation = req.body.designation;
            const categoryStaff = req.body.categoryStaff;
            const mobile = req.body.mobile;
            const rank = req.body.rank;
            const speech = req.body.speech
            const committee = req.body.committee;
            
            const pic = req.files.image;
            const picData = pic.data;
            const encodedPic = picData.toString('base64');
            const imageBuffer = Buffer.from(encodedPic, 'base64');
            const data = {
                name,
                designation,
                categoryStaff,
                rank,
                speech,
                mobile,
                committee,
                image: imageBuffer
            }
            const result = await staffCollection.insertOne(data);
            res.json(result);
        })
        app.get('/staff', async (req, res) => {
            console.log()
            const cursor = staffCollection.find({});
            const saffs = await cursor.toArray();
            res.json(saffs);
        });
        app.get('/staff/:id', async (req, res) => {

            
            const query = { _id: ObjectId(req.params.id) }
            console.log(query)
            const staf = await staffCollection.findOne(query);
      
            res.json(staf);
        });
       
        app.delete('/staff/:id', async(req , res)=>{
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const data = await staffCollection.deleteOne(query);
            console.log('deleted item ' , data)
            res.json(data);
        })

        app.patch('/staff/edit/:id', async(req,res)=>{
        
            const id = req.params.id
            const name = req.body.name;
            const designation = req.body.designation;
            const categoryStaff = req.body.categoryStaff;
            const mobile = req.body.mobile;
            const rank = req.body.rank;
            const speech = req.body.speech;
            const committee= req.body.committee
            
           console.log(id)
            const filter = {_id: ObjectId(id)};
            console.log(filter)
            
            const updateDoc = {$set:  {name:name, designation:designation, categoryStaff:categoryStaff, mobile:mobile, rank:rank , speech:speech , committee:committee} };
          
            const result = await staffCollection.updateOne(filter, updateDoc );
            console.log(result)
            res.json(result)
        }) 

        //student Manage 


        app.post('/student', async (req, res) => {
            const name = req.body.name;
            const fatherName = req.body.fatherName;
            const motherName = req.body.motherName;
            const courseId = req.body.courseId
             const roll = req.body.roll;
            const sessionStart = req.body.sessionStart;
            const sessionEnd = req.body.sessionEnd;
            const regNo = req.body.regNo;
            const course = req.body.course;
            const category = req.body.category;
            const mobile = req.body.mobile;
            
            const data = {
                name,
                fatherName,
                motherName,
                courseId,
                roll,
                regNo,
                category,
                course,
                mobile,
                sessionStart,
                sessionEnd,
                
            }
            const result = await studentCollection.insertOne(data);
            res.json(result);
        })
        app.get('/student', async (req, res) => {
            const cursor = studentCollection.find({});
            const saffs = await cursor.toArray();
            res.json(saffs);
        });

        app.patch('/student/edit',  async(req,res)=>{
            const id = req.body._id
            const name = req.body.name;
            const roll = req.body.roll;
            const sessionStart = req.body.sessionStart;
            const sessionEnd = req.body.sessionEnd;
            const regNo = req.body.regNo;
            const course = req.body.course;
            const category = req.body.category;
            const mobile = req.body.mobile;
            const filter = {_id: ObjectId(id)};
            
            const updateDoc = {$set:  {name:name, roll:roll, sessionStart:sessionStart,sessionEnd:sessionEnd,regNo:regNo,course:course,category:category, mobile:mobile} };
          
            const result = await studentCollection.updateOne(filter, updateDoc );
            console.log(result)
            res.json(result)
        }) 
        app.get('/student/home', async(req, res) =>{
            console.log('query', req.query);
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);

            const query = {};
            const cursor = studentCollection.find(query);
            let students;
            if(page || size){
              
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


        app.delete('/student/:id' ,  async(req , res)=>{
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const data = await studentCollection.deleteOne(query);
            console.log('deleted item ' , data)
            res.json(data);
        })

 //information

        app.post('/info',   async (req, res) => {
            const session = req.body.session;
            const maleGenaral = req.body.maleGenaral;
            const malePoor = req.body.malePoor;
     
        const femaleGenaral= req.body.femaleGenaral;
            const  femalePoor = req.body.femalePoor;
        const numbers=req.body.numbers;
       const enrolled= req.body.enrolled;
       const course = req.body.course;
       const courseId = req.body.courseId
    

            const data = {
                session,
                maleGenaral,
        malePoor,
        femaleGenaral,
        femalePoor ,
        numbers,
        enrolled,
        course,
        courseId 
     
            }
            const result = await InfoCollection.insertOne(data);
            res.json(result);
        })

        app.get('/info', async (req, res) => {
            const cursor = InfoCollection.find({});
            const saffs = await cursor.toArray();
            res.json(saffs);
        });
        app.get('/info/:course', async (req, res) => {
            console.log(req.params.course)
            const query = { courseId:(req.params.course) }
            const cursor = InfoCollection.find(query);
            const saffs = await cursor.toArray();
            res.json(saffs);
        });
        app.get('/info/:id', async (req, res) => {
            const query = { _id: ObjectId(req.params.id) }
            
            const notice = await InfoCollection.findOne(query);
      
            res.json(notice);
        });
        
        app.delete('/info/:id' ,  async(req , res)=>{
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const data = await InfoCollection.deleteOne(query);
            console.log('deleted item ' , data)
            res.json(data);
        })


        app.put('/info/edit/:id', async(req,res)=>{
        
            const id = req.params.id

            
        const session = req.body.session;
        const maleGenaral = req.body.maleGenaral;
        const malePoor = req.body.malePoor;
 
    const femaleGenaral= req.body.femaleGenaral;
        const  femalePoor = req.body.femalePoor;
    const numbers=req.body.numbers;
   const enrolled= req.body.enrolled;
   const course= req.body.course;

        
            const filter = {_id: ObjectId(id)};
            
            
            const updateDoc = {$set:  {session :session , maleGenaral:maleGenaral ,malePoor:malePoor ,femaleGenaral:femaleGenaral,femalePoor:femalePoor,numbers:numbers,enrolled:enrolled ,course:course} };
          
            const result = await InfoCollection.updateOne(filter, updateDoc );
            console.log(result)
            res.json(result)
        }) 

        //course
        
      
        app.post('/courses',   async (req, res) => {
            const courseName = req.body.courseName;
            const duration = req.body.duration;
            const sit = req.body.sit;
            const requirements = req.body.requirements;

         
            const data = {
                courseName,
                duration,
                sit,
                requirements,
               
            }
            const result = await coursesCollection.insertOne(data);
            res.json(result);
        })

        app.get('/courses', async (req, res) => {
            const cursor = coursesCollection.find({});
            const saffs = await cursor.toArray();
            res.json(saffs);
        });

        app.get('/coursesInfo/:id', async (req, res) => {
            const query = { _id: ObjectId(req.params.id) }
            
            const notice = await coursesCollection.findOne(query);
      
            res.json(notice);
        });


        app.get('/courses/:id', async (req, res) => {
            const query = { _id: ObjectId(req.params.id) }
            
            const notice = await coursesCollection.findOne(query);
      
            res.json(notice);
        });
        
        app.delete('/courses/:id' ,  async(req , res)=>{
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const data = await coursesCollection.deleteOne(query);
            console.log('deleted item ' , data)
            res.json(data);
        })


        app.put('/courses/edit/:id', async(req,res)=>{
        
   
            const id = req.params.id;
        const courseName = req.body.courseName;
        const duration = req.body.duration;
        const sit = req.body.sit;
        const requirements= req.body.requirements;
    
        
        const filter = {_id: ObjectId(id)};
            
            
            const updateDoc = {$set:  {courseName:courseName, duration:duration , sit:sit , requirements:requirements} };
          
            const result = await coursesCollection.updateOne(filter, updateDoc );
            console.log(result)
            res.json(result)
        }) 


    }
    
    
    




    finally{
        // fawait client.close();
    }


}

run().catch(console.dir);



app.get('/', ( req , res)=>{
    res.send('srcn connected')
})

app.listen(port , ()=>{
    console.log(`listening at ${port}`)
})