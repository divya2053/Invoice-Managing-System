const express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
mongoose.set('useFindAndModify', false);
const Invoice = mongoose.model("Invoice");
const Customer = mongoose.model("Customer");
const User = mongoose.model("User");
const helpers = require("handlebars-helpers")();

router.get("/", (req, res) => {
  Customer.find({}).then(customers => {
    res.render("invoice/addOrEdit", {
      customers: customers
    });
  });
});

router.post("/", (req, res) => {
  console.log(req.body._id);
  if (req.body._id == "") insertRecord(req, res);
  else updateRecord(req, res);
});

// Find all invoices for client
// View Client Form
router.post("/search/:invoice_customer", (req, res) => {
  console.log(req.params.invoice_customer);
  Customer.findOne({email:req.params.invoice_customer}).then(customer=>{
      Invoice.find({
        invoice_customer: req.params.invoice_customer
      }).then(invoicecustomer => {
        res.render("invoice/search", {
          name: customer.fullName,
          invoicecustomer: invoicecustomer
        });
      });
  });
});

// Search Page
router.get("/searchcustomer", (req, res) => {
  Customer.find({}).then(customers => {
    res.render("invoice/searchcustomer", {
      customers: customers
    });
  });
});

function insertRecord(req, res) {


  Customer.findOne({fullName:req.body.invoice_customer}).then(customer=>{
      console.log(customer);
      if(customer){
      var invoice = new Invoice();
      invoice.invoice_customer = customer.email;
      invoice.item = req.body.item;
      invoice.date = req.body.date;
      invoice.notes = req.body.notes;
      invoice.amount = req.body.amount || "0";
      invoice.owed = req.body.owed || "0";
      invoice.isPaid = req.body.amount == req.body.owed ? "True" : "False";
      // invoice.invoice_customer = req.body.invoice_customer;
      invoice.save((err, doc) => {
        if (!err) res.redirect("invoice/list");
        else {
          console.log("Error during record insertion : " + err);
        }
      });
    }
  });

}

function updateRecord(req, res) {
  Invoice.findOneAndUpdate(
    { _id: req.body._id },
    req.body,
    { new: true },
    (err, doc) => {
      if (!err) {
        res.redirect("invoice/list");
      } else {
        if (err.name == "ValidationError") {
          handleValidationError(err, req.body);
          res.render("invoice/addOrEdit", {
            viewTitle: "View Invoice",
            invoice: req.body
          });
        } else console.log("Error during record update : " + err);
      }
    }
  );
}

router.get("/list", (req, res) => {
  Invoice.find((err, docs) => {
    if (!err) {
      res.render("invoice/list", {
        list: docs
      });
    } else {
      console.log("Error in retrieving invoice list " + err);
    }
  });
});

router.get("/paid", (req, res) => {
  Invoice.find((err, docs) => {
    if (!err) {
      res.render("invoice/paid", {
        list: docs
      });
    } else {
      console.log("Error in retrieving invoice list " + err);
    }
  });
});

router.get("/:id", async (req, res) => {
  let list = [];
  list.invoice = await Invoice.findById(req.params.id);
  list.customers = await Customer.find({});
  // console.log(list);
  res.render("invoice/addOrEdit", list);
});

router.get("/delete/:id", (req, res) => {
  Invoice.findByIdAndDelete(req.params.id, (err, doc) => {
    if (!err) {
      res.redirect("/invoice/list");
    } else {
      console.log("Error in invoice delete :" + err);
    }
  });
});


// router.get("/search",(req,res)=>{
//   res.render("/invoice/search");
// });


// View

module.exports = router;
