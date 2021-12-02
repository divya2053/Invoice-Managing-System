require("./models/db");

const express = require("express");
const router = express.Router();
const path = require("path");
const exphbs = require("express-handlebars");
const bodyparser = require("body-parser");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
var cookieParser = require('cookie-parser');
var session = require('express-session');
const url = require('url');

const mongoose = require("mongoose");
const Invoice = mongoose.model("Invoice");
const Customer = mongoose.model("Customer");
const User = mongoose.model("User")

const customerController = require("./controllers/customerController");
const invoiceController = require("./controllers/invoiceController");
const emailController = require("./controllers/emailController");
const userController = require("./controllers/userController");

const middleware = require("./middlewares/login");
const { log } = require("console");
const { raw } = require("body-parser");
const stripe = require("stripe")('sk_test_51HNG88DpcbWR7u7oM7rYPd0bpoUKfv4lwsIqLKQfBqHUjqVyBY93wPGyRR4rtN8IGo6JbkWRDGcYx8YG2QKtHvy300diS0u9S6');

const validator = require("./middlewares/validator");

const crypto = require('crypto');




const app = express();

app.use(
  bodyparser.urlencoded({
    extended: true
  })
);
app.use(bodyparser.json());
app.set("views", path.join(__dirname, "/views/"));
app.engine(
  "hbs",
  exphbs({
    extname: "hbs",
    defaultLayout: "mainLayout",
    layoutsDir: __dirname + "/views/layouts/"
  })
);
app.set("view engine", "hbs");
app.use(express.static("public"));



// app.use(cookieParser());

// initialize express-session to allow us track the logged-in user across sessions.
// app.use(session({
//   key: 'user_sid',
//   secret: 'somerandonstuffs',
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     expires: 600000
//   }
// }));

app.use(session({
  secret: "xYUCAchitkaraa",
  saveUninitialized: true,
  resave: true,
  cookie: {
    expires: 3600000
  }
}));



// app.use(middleware);


app.get("/dashboard", middleware, async (req, res) => {
  if (req.session.role == 'admin') {
    let list = [];
    list.result = await Invoice.countDocuments({ isPaid: "False" });
    list.result2 = await Invoice.countDocuments({ isPaid: "True" });
    list.result3 = await Invoice.countDocuments({});
    list.result4 = await Customer.countDocuments({});
    list.result5 = await Invoice.find({ isPaid: "False" });
    res.render("dashboard", list);
  } else {
    res.render("error", {
      msg: "Not Authorized",
      redirect: "/user"
    })
  }
});

var port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

app.get('/', function (req, res) {
  console.log(req.session);
  if (req.session.isLogin == 1) {
    if (req.session.role == 'admin') {
      res.redirect("/dashboard");
    } else {
      res.redirect("/user");
    }
  } else {
    res.sendFile(__dirname + "/public/index1223.html");
  }
});

app.post("/login", (req, res) => {

  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      if (user.password == req.body.password) {

        req.session.isLogin = 1;
        req.session.id = user._id;
        req.session.email = user.email;
        req.session.role = user.role;
        // res.send(data);

        console.log("Session Created");

        if (req.session.role == "admin") {
          res.redirect("/dashboard");
        } else {
          res.redirect(url.format({
            pathname: "/user",
            query: {
              "email": req.body.email
            }
          }));
        }
      } else {
        res.render("error", {
          msg: "Password or email Incorrect",
          redirect: "/"
        })
      }
    } else {
      res.render("error", {
        msg: "User with specified email doesn't exist",
        redirect: "/"
      });
    }
  }
  );
});

app.post("/signin", (req, res) => {

  User.findOne({ email: req.body.email }).then(users => {

    if (!users) {
      var user = new User();
      user.email = req.body.email;
      user.password = req.body.password;
      user.verified = "false";
      user.role = "user";

      user.save((err, doc) => {
        if (!err) {
          console.log("User Saved");
          res.redirect("/");
        } else {
          console.log(err);
        }

      });
    } else {
      res.render("error", {
        msg: "Email already exists"
      });
    }
  });
});

app.get("/changepass", (req, res) => {

  User.findOne({ email: req.session.email }).then(user => {

    if (req.session.role == 'admin') {
      res.render('changepassword', {
        password: user.password
      });
    } else {
      res.render('changepassword', {
        password: user.password,
        layout: 'userLayout.hbs'
      });
    }
  });


});


app.post("/changepass", (req, res) => {
  console.log(req.session.email + "" + req.body.password);

  var myquery = {
    email: req.session.email
  };
  var newvalues = {
    $set: {
      password: req.body.password
    }
  };

  User.updateOne(myquery, newvalues, (err, res) => {
    if (!err) {
      console.log("Password Changed");
    } else {
      console.log(err);
    }
  });


  if (req.session.role == 'admin') {
    res.redirect("/dashboard");
  } else {
    res.redirect("/user");
  }
});


app.use("/customer", middleware,validator, customerController);

app.use("/invoice", middleware,validator, invoiceController);

app.use("/email", middleware,validator ,emailController);

app.use("/user", userController);

app.get("/logout", (req, res) => {
  req.session.isLogin = 0;
  console.log(req.session.role);
  res.redirect("/");
});

app.post("/create-checkout-session/:id", middleware, async (req, res) => {

  console.log(req.params.id);

  Invoice.findById(req.params.id).then(async (invoice) => {
    console.log(invoice);
    var amount = (parseInt(invoice.amount) - parseInt(invoice.owed)) * 100;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "inr",
          product_data: {
            name: invoice.item,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },],
      mode: "payment",
      success_url: "https://lop-invoice-system.herokuapp.com/user/success/" + req.params.id,
      cancel_url: "https://lop-invoice-system.herokuapp.com/user/failure",
    });

    res.json({
      id: session.id
    });
  }).catch(err => {
    console.log(err);
  });

});

app.get("/forgotpass", (req, res) => {
  res.sendFile(__dirname + "/public/forgot.html");
});


app.get("/reset/:id", (req, res) => {

  User.findOne({
    resetLink: req.params.id
  }).then(user => {
    if (user) {
      if (user.isLinkValid) {
        res.render("reset", {
          link: user.resetLink,
          layout: ""
        });
      } else {
        res.render("error", {
          msg: "Link not valid",
          redirect: "/",
          layout: ""
        })
      }
    } else {
      console.log(req.params.id);
    }
  })
});

app.post("/reset/:id", (req, res) => {

  var myquery = {
    resetLink: req.params.id
  };
  var newvalues = {
    $set: {
      password: req.body.password,
      resetLink: "",
      isLinkValid: false
    }
  };
  User.updateOne(myquery, newvalues, (err, doc) => {
    if (err) {
      throw err;
    } else {
      res.render("error", {
        msg: "Password Updated Successfully",
        redirect: "/",
        layout: ""
      })
    }
  });
});




app.get("/forgotpass",(req,res)=>{
  res.sendFile(__dirname+"/public/forgot.html");
});


app.get("/reset/:id",(req,res)=>{

  User.findOne({
    resetLink : req.params.id
  }).then(user => {
    if (user) {
      if (user.isLinkValid) {
          res.render("reset",{
            link:user.resetLink,
            layout:""
          });
      } else {
        res.render("error", {
          msg: "Link not valid",
          redirect: "/",
          layout: ""
        })
      }
    } else {
      console.log(req.params.id);
    }
  })
});

app.post("/reset/:id",(req,res)=>{

  var myquery = {
    resetLink : req.params.id
  };
  var newvalues = {
    $set: {
      password: req.body.password,
      resetLink : "",
      isLinkValid : false
    }
  };
  User.updateOne(myquery,newvalues,(err,doc)=>{
    if(err){
      throw err;
    }else{
      res.render("error",{
        msg:"Password Updated Successfully",
        redirect:"/",
        layout:""
      })
    }
  });
});


app.post("/forgotpass",(req,res)=>{  

  // console.log(req.body.email);
  User.findOne({email:req.body.email}).then(user=>{
    if(user){

      var query = {
        email: req.body.email
      };

      var newvalues = {
        $set: {
          isLinkValid: true
        }
      };

      User.updateOne(query,newvalues,(err,docs)=>{
        if(!err){
          console.log("User Updated");
        }else{
          throw err;
        }
      })

      setTimeout(() => {
        newvalues = {
          $set: {
            isLinkValid: false,
            resetLink:""
          }
        };
        User.updateOne(query, newvalues, (err, docs) => {
          if (!err) {
            console.log("User Updated after 15 seconds");
          } else {
            throw err;
          }
        })
      }, 600000);

      crypto.randomBytes(32, (err, buf) => {
        if (err) throw err;
        newvalues = {
          $set: {
            resetLink:buf.toString('hex')
          }
        };

        User.updateOne(query,newvalues,(err,docs)=>{
          if(err){
            throw err;
          }else{
            // buf.toString('hex')

            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: 'invoicesys28@gmail.com',
                pass: 'invoice12'
              }
            });

            const link = "https://lop-invoice-system.herokuapp.com/reset/"+buf.toString('hex');

            const mailOptions = {
              from: 'invoicesys28@gmail.com',
              to: req.body.email,
              subject: 'Reset Link for your to account ',
              text: 'Reset Link for your account is ' +  link
            };

            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.log(error);
              } else {
                console.log('Email sent: ' + info.response);
                res.render("error",{
                  msg:"Check your mail for further instructions",
                  redirect:"/",
                  layout:""
                })
              }
            });

          }
        });

        console.log(buf.length + ' bytes of random data: ' + buf.toString('hex'));
        

      });


    }else{
      res.render("error",{
        msg:"Email doesn't exist",
        redirect:"/",
        layout:""
      });
    }
  })

});