//This Router enables us to upload files.
const express = require('express');
const bodyParser = require('body-parser');
const authenticate = require('../authenticate');
//"multer" Node module nam omogucava "files uploading".
const multer = require('multer');

//One of the options that "multer" takes is for the storage. So, "multer" provides this "disk.Storage()" function which 
//enables us to define the storage engine and in here we can configure a few things. The options that we are going to 
//define are "destination" and "filename". "destination" allows us to configure the destination and it is a function that
//takes "req" (request), object called "file" which contains information about the file that has been processed by "multer", and
//a "callback" function. Through the callback function, we will pass information back to "multer" configuration. "callback" function
//takes two parameters, first is "error" and a second is a destination folder where the files will be stored and it can be expresses
//as a string. Posto cemo mi u ovoj vezbi da implementiramo "image uploads", "destination folder" cemo da stavimo da nam bude 
//"public/images", i sve slike koje "upload"-ujemo ce biti smestene u "public/images" folder. "filename" funkcionise na 
//slican nacin. Isto je funkcija koja prima tri parametra, "red", "file" i "callback" funkciju. Through the callback function, 
//we will pass information back to "multer" configuration."callback" function takes two parameters, first is "error" and a second
//is file name that is going to be used for the specific file when that file is stored. "file" object suports several properties
//on it, and one of the properties is called "originalname". The "originalname" gives us the original name of the file from the
//client side that has been uploaded. Now, we insist that, when the file is saved on the server side, the file will be given exactly
//the same name as the original name of the file that has been uploaded. Now, if you don't configure this, then "multer" by default
//will give some random string as the name of the file with no extensions. That may not be something that we would be happy about 
//using in this particular exercise. So, that's why we are explicitly configuring saying that, the file should be stored with the 
//original name of the file that has been uploaded.
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'public/images');
    },
    filename: (req, file, callback) => {
        callback(null, file.originalname)
    }
});

//We can also specify a file filter for the "multer" configuration. The file filter will enable us to specify which kind of files
//we are willing to accept for uploading. Definisemo funckiju "imageFileFilter" koja prima tri parametra, kao i funkcije "destination"
//i "filename". Parametri su "req", "file" i "callback" funkcija. Through the callback function, we will pass information back to "multer"
//configuration. Posto je "file.originalname" string, proveravamo da li se ime fajla zavrsava sa nekom od ekstenzija koje navodimo u
//regularnom izrazu. Ako se zavrsava sa nekom od ekstenzija koju smo naveli, onda cemo omoguciti "upload"-ovanje fajla. Ako se ne zavrsava
//sa nekom od ekstenzija koju smo naveli, necemo dati korisniku da "upload"-uje fajl. "callback" funkcija prima dva parametra, prvi je 
//error, a drugi je true/false sto znaci da dopustamo ili ne dopustamo "upload"-ovanje fajla.
const imageFileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return callback(new Error('You can upload only image files!'), false);
    }
    callback(null, true);
};

//Setting up "multer" Node module to enable us to upload the files. By default, "multer" can be
//set up by simply using "multer" within our application, but we are going to do some configuration
//of "multer" so that we are going to costumize the way multer handles the upload of the files.
const upload = multer({ storage: storage, fileFilter: imageFileFilter });

const uploadRouter = express.Router();

uploadRouter.use(bodyParser.json());

//We are going to allow only a "post" method on the "/imageUpload" endpoint. So, the "get", "put" and "delete" will not be allowed
//on the "/imageUpload" endpoint.
uploadRouter.route('/')
    .options((req, res) => { res.sendStatus(200); })
    .get(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end('GET operation not supported on /imageUpload');
    })
    //In addition to the "authenticate.verifyUser" and "authenticate.verifyAdmin", we will configure the "upload". We have configured "upload" 
    //by using "multer" in the code above and we are going to make use of the "upload" which supports a function called as "upload.single".
    //This "single" function takes as the parameter the name of the form field which specifies the file. This form field we will name it as "imageFile".
    //"upload.single" means that it is going to allow us to upload only a single file. That single file will be specified in the upload form from the 
    //client side in the multi-part form upload by using "imageFile" name. When the file is obtained in the code, if we come up to this point, this "upload"
    //will take care of handling the errors if there are any, if the file is not properly uploaded and so on.
    .post(authenticate.verifyUser, authenticate.verifyAdmin, upload.single('imageFile'), (req, res) => {
        //When we come up to this point, the file would have been successfully uploaded and so we need to handle the uploaded file.
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        //We will pass back this "req.file" object from the server back to the client. The "req.file" contains a lot of information about the file that has
        //just been uploaded. This "req.file" object will also contain the path to the file and that path can be used by the client to configure any place 
        //where it needs to know the location of this image file. For example, if you are trying to upload a dish and the details of the dish to the server
        //side, you might upload the image to the server and then you get back the URL of that image. Then you can include the URL of that image into the json
        //object that describes the dish, and then upload the dish json document to the server side.
        res.json(req.file);
    })
    .put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /imageUpload');
    })
    .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end('DELETE operation not supported on /imageUpload');
    });

module.exports = uploadRouter;