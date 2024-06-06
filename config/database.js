const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

const mongodbConnect = mongoose
  .connect(process.env.MONGODB_DATABASE_URL, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connected to database...");
  });

mongoose.connection.on("error", (err) => {
  console.log(err);
});

module.exports = mongodbConnect;
