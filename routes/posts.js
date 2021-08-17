var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
let multer = require('multer');
var sanitizeHtml = require('sanitize-html');

var database = require('../database.json');
const moment = require('moment');


let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/images");
  },
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    cb(null,path.basename(file.originalname, ext) + "-" + Date.now() + ext);
  }
});

let upload = multer({storage: storage});


/* GET users listing. */
router.get('/list', (req, res) => {

  res.render("posts/list", { database: database })
});

router.get('/view/:id', (req, res) => {
  console.log("id: " + req.params.id);
  let post = database.find(v => v.id == req.params.id)
  console.log(post)
  res.render("posts/view", { post: post })
});
   
router.get('/delete/:id', (req, res) => {
  console.log("id: " + req.params.id);
  
  database = database.filter(v => v.id !== parseInt(req.params.id))
  console.log(database)

  databaseJson = JSON.stringify(database, null, '  ')
  fs.writeFileSync('database.json', databaseJson)  

  res.redirect("/posts/list")
});


router.get('/form', function(req, res, next) {
  let post = { type: "new", nickname: "", title: "", content: "" }
  res.render('posts/form', { post: post });
});

router.get('/form/:id', (req, res) => {
  console.log("id: " + req.params.id);
  let post = database.find(v => v.id == req.params.id)
  console.log(post)

  post.type = "edit"
  res.render("posts/form", { post: post })
});



router.post('/upload-image', upload.single('img'), (req, res) => {
  console.log(req.file);
  let response = {}
  response.url = `/images/${path.basename(req.file.path)}`
  // res.end(`{ "url": "/images/${path.basename(req.file.path)}" }`)
  res.json(response)
});
    


router.post('/create-article', (req, res) => {
  console.log(req.body);

  let post = {}
  let postType = "new"
  let databaseJson = ""

  if (req.body.id === undefined) {
    console.log(database.map( v => v.id ))
    post.id = Math.max( ...database.map( v => v.id ) ) + 1
    postType = "new"
    post.regdt = moment().format('YYYY-MM-DD HH:mm:ss')
  } else {
    post.id = parseInt(req.body.id)
    post = database.find(v => v.id === post.id)
    postType = "edit"
  }

  console.log("postType: " + postType + ", post.id: " + post.id + ", req.body.id: " + req.body.id)

  post.nickname = req.body.nickname
  post.title = req.body.title
  post.content = req.body.content
  post.moddt = moment().format('YYYY-MM-DD HH:mm:ss')

  post.content = sanitizeHtml(post.content, {
    allowedTags: [ 'p', 'b', 'i', 'em', 'strong', 'font', 'br', 'span', 'blockquote', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'iframe', 'img' ],
    allowedAttributes: {
      'a': [ 'href', 'target', 'class', 'style' ],
      'p': [ 'class', 'style' ],
      'font': [ 'color', 'class', 'style' ],
      'span': [ 'color', 'class', 'style' ],
      'blockquote': [ 'color', 'class', 'style' ],
      'h1': [ 'class', 'style' ],
      'h2': [ 'class', 'style' ],
      'h3': [ 'class', 'style' ],
      'h4': [ 'class', 'style' ],
      'h5': [ 'class', 'style' ],
      'h6': [ 'class', 'style' ],
      'iframe': [ 'src', 'frameborder', 'width', 'height', 'class' ],
      'img': [ 'src', 'width', 'height', 'class', 'style' ]
    },
    allowedIframeHostnames: ['www.youtube.com']
  });
  
  if (postType === "new") {
    database.push(post)
    console.log("new push")
  }


  databaseJson = JSON.stringify(database, null, '  ')

  fs.writeFileSync('database.json', databaseJson)

  //response.url = `/images/${path.basename(req.file.path)}`
  // res.end(`{ "url": "/images/${path.basename(req.file.path)}" }`)
  res.redirect("list")
});


module.exports = router;
