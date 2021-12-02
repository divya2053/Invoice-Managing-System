const mongoose = require("mongoose");

mongoose.connect('mongodb+srv://admin:admin@cluster0.bp37d.mongodb.net/InvoiceSystem?retryWrites=true&w=majority', {
  useNewUrlParser: true
}, err => {
  if (!err) {
    console.log("MongoDB Connection Successful");
  } else {
    console.log("Error in DB connection : " + err);
  }
});

require("./invoice.model");
require("./customer.model");
require("./user.model");
