const express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
const Customer = mongoose.model("Customer");
const Invoice = mongoose.model("Invoice");


var hbs = require("nodemailer-express-handlebars");
//attach the plugin to the nodemailer transporter

router.get("/email/:email", (req, res) => {
  let emailtest = req.params;
  Customer.distinct("email", function(error, ids){}.then(customers => {
    let xdmydood = customers[0].fullName;
    Invoice.find({ invoice_customer: xdmydood }).then(thecustomer => {
      sendInvoice(emailtest.email, thecustomer);
    });
  }));
  res.render("email/email");
});

var o = 0;

router.get("/all", (req, res) => {
  Customer.distinct("email", function(error, ids) {
    let theEmail = ids;
    let emailAll = function() {
      if (o < theEmail.length) {
        let oneEmail = theEmail[o];
        Customer.find({ email: oneEmail }).then(customers => {
          let customerName = customers[0].fullName;
          Invoice.find({ invoice_customer: customerName }).then(thecustomer => {
            sendInvoice(oneEmail, thecustomer);
          });
        });
        o++;
        emailAll();
      } else {
        return;
      }
    };
    emailAll();
  });
  res.render("email/email");
});

// router.get("/all", (req, res) => {
//   Customer.distinct("email", function(error, ids) {
//     sendInvoice(ids);
//   });
// });

function sendInvoice(oneEmail, data,customerName) {
  var nodemailer = require("nodemailer");
  var hbs = require("nodemailer-express-handlebars");
  var options = {
    viewEngine: {
      extname: ".hbs",
      layoutsDir: "views/email/",
      defaultLayout: "template",
      partialsDir: "views/partials/"
    },
    viewPath: "views/email/",
    extName: ".hbs"
  };

  var transporter = nodemailer.createTransport({
    host:"smtp.gmail.com",
    secure:"true",
    port:465,
    service: "gmail",
    auth: {
      user: "invoicesys28@gmail.com",
      pass: "invoice12"
    }
  });

  transporter.use("compile", hbs(options));
  transporter.sendMail({
    from: "invoicesys28@gmail.com",
    to: oneEmail,
    subject: "Invoices",
    template: "email_body",
    context: {
      name:customerName,
      data: data
    }
  });

  console.log("Mail sent Successfully"+data);
}

router.get("/test", (req, res) => {
  Customer.find({}).then(customers => {
    res.render("email/test", {
      customers: customers
    });
  });
  // console.log(req);

});

router.post("/test",(req,res)=>{
  // console.log(req.body);
})

router.get("/:email",(req,res)=>{
  console.log(req.params.email)
  Customer.find({email:req.params.email}).then(customers=>{
    console.log("Hello................................................................" + customers[0].email);
    Invoice.find({invoice_customer:customers[0].email}).then(invoices=>{
      sendInvoice(req.params.email, invoices,customers[0].fullName);
      res.redirect("/invoice/list");

    })

  });

  // res.render('email/email',{
  //   email:req.params.email
  // })
});

module.exports = router;
