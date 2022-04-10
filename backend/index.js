const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
var mysql = require("mysql");
var cookieParser = require("cookie-parser");
const sessions = require("express-session");

const oneDay = 1000 * 60 * 60 * 24;
let session;

app.use(
  sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false,
  })
);

app.use(cookieParser());

app.use(express.json({ extended: false }));

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "friendly",
});

con.connect(function (err) {
  if (err) throw err;
  console.log("connected");
});

app.get("/", (req, res) => {
  res.json({
    name: "hello",
  });
});

app.post("/signup", (req, res) => {
  var sql = `INSERT INTO signup (name, email, password, nickname) VALUES ("${req.body.name}", "${req.body.email}", "${req.body.password}", "${req.body.nickname}")`;
  let b = req.body.email.split("@");
  let c = b[1].split(".");
  let tablename = b[0] + c[0] + c[1] + "";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("1 record inserted");
    con.query("SELECT * FROM signup", function (err, result, fields) {
      res.json({ status: "success", ...req.body });
    });
  });
  var createPost = `CREATE TABLE ${tablename}post (content VARCHAR(255), date VARCHAR(255), time VARCHAR(255), likes INT,  postId VARCHAR(255), ID int NOT NULL AUTO_INCREMENT PRIMARY KEY)`;
  var createFlist = `CREATE TABLE ${tablename}flist (email VARCHAR(255), name VARCHAR(255), ID int NOT NULL AUTO_INCREMENT PRIMARY KEY)`;
  var createFrequest = `CREATE TABLE ${tablename}frequest (email VARCHAR(255), name VARCHAR(255), ID int NOT NULL AUTO_INCREMENT PRIMARY KEY)`;
  con.query(createPost, function (err, result) {
    if (err) throw err;
    console.log("Post Table Created");
  });
  con.query(createFlist, function (err, result) {
    if (err) throw err;
    console.log("Friend List Table Created");
  });
  con.query(createFrequest, function (err, result) {
    if (err) throw err;
    console.log("Friend Req Table Created");
  });
});

app.post("/login", (req, res) => {
  con.query(
    `SELECT * FROM signup WHERE email="${req.body.username}"`,
    function (err, result, fields) {
      if (err) throw err;
      console.log(result);
      if (
        result &&
        result[0] &&
        result[0].email == req.body.username &&
        result[0].password == req.body.password
      ) {
        let b = req.body.username.split("@");
        let c = b[1].split(".");
        let tablename = b[0] + c[0] + c[1] + "";
        session = req.session;
        session.userid = req.body.username;
        session.password = req.body.password;
        session.tablename = tablename;
        res.json({ status: "login successful" });
        // res.cookie(`backend${req.body.username}`, {
        //   username: req.body.username,
        // });
        // res.json({ status: "login successful" });
        // res.send("Logged In as " + value.username);
        // res.redirect("/dashboard");
        // app.get("/dashboard", (req2, res) => {
        //   res.cookie(`backend${req.body.username}`, {
        //     username: req.body.username,
        //   });
        //   res.json({ status: "login successful" });
        // });
      } else {
        res.json({ status: "login unsuccessful" });
      }
    }
  );
});

app.get("/friends", (req, res) => {
  if (session) {
    con.query(
      `SELECT * FROM ${session.tablename}flist`,
      function (err, result, fields) {
        if (err) throw err;
        res.json(result);
      }
    );
  } else {
    res.json({
      status: "Not logged In",
    });
  }
});

app.get("/pendingrequest", (req, res) => {
  if (session) {
    con.query(
      `SELECT * FROM ${session.tablename}frequest`,
      function (err, result, fields) {
        if (err) throw err;
        res.json(result);
      }
    );
  } else {
    res.json({
      status: "Not logged In",
    });
  }
});

app.post("/pendingrequestaccept", (req, res) => {
  if (session) {
    con.query(
      `SELECT * FROM ${session.tablename}frequest WHERE email="${req.body.email}"`,
      function (err, result, fields) {
        if (err) throw err;
        if (result[0] !== undefined) {
          con.query(
            `INSERT INTO ${session.tablename}flist (email, name) VALUES ("${result[0].email}", "${result[0].name}")`,
            function (err, result, fields) {
              if (err) throw err;
              con.query(
                `DELETE FROM ${session.tablename}frequest WHERE email="${req.body.email}"`,
                function (err, result, fields) {
                  if (err) throw err;
                  res.json({ status: "done" });
                }
              );
            }
          );
        } else {
          res.json({ status: "no request present" });
        }
      }
    );
  } else {
    res.json({
      status: "Not logged In",
    });
  }
});

app.post("/pendingrequestreject", (req, res) => {
  if (session) {
    con.query(
      `SELECT * FROM ${session.tablename}frequest WHERE email="${req.body.email}"`,
      function (err, result, fields) {
        if (err) throw err;
        if (result[0] !== undefined) {
          con.query(
            `DELETE FROM ${session.tablename}frequest WHERE email="${req.body.email}"`,
            function (err, result, fields) {
              if (err) throw err;
              res.json({ status: "done" });
            }
          );
        } else {
          res.json({ status: "no request present" });
        }
      }
    );
  } else {
    res.json({
      status: "Not logged In",
    });
  }
});

app.post("/searchfriends", (req, res) => {
  if (session) {
    con.query(
      `SELECT * FROM ${session.tablename}flist WHERE email="${req.body.fdata}" OR name="${req.body.fdata}"`,
      function (err, result, fields) {
        if (err) throw err;
        res.json({ status: "DATA FOUND", length: result.length, ...result });
      }
    );
  } else {
    res.json({
      status: "Not logged In",
    });
  }
});

app.post("/friendsprofile", (req, res) => {
  let b = req.body.email.split("@");
  let c = b[1].split(".");
  let tablename = b[0] + c[0] + c[1] + "";
  con.query(
    `SELECT * FROM ${session.tablename}flist WHERE email="${req.body.email}"`,
    function (err, result, fields) {
      if (err) throw err;
      if (result[0] !== undefined) {
        con.query(
          `SELECT * FROM ${tablename}flist`,
          function (err, result1, fields) {
            if (err) throw err;
            con.query(
              `SELECT * FROM ${tablename}post`,
              function (err, result2, fields) {
                if (err) throw err;
                if (session) {
                  con.query(
                    `SELECT * FROM ${session.tablename}flist`,
                    function (err, result3, fields) {
                      if (err) throw err;
                      res.json({
                        status: "FETCHED",
                        friendslength: result1.length,
                        postlength: result2.length,
                        result1,
                        result2,
                        result3,
                      });
                    }
                  );
                } else {
                  res.json({
                    status: "Not logged In",
                  });
                }
              }
            );
          }
        );
      } else {
        res.json({ status: "No friend found" });
      }
    }
  );
});

app.post("/unfriend", (req, res) => {
  if (session) {
    con.query(
      `SELECT * FROM ${session.tablename}flist WHERE email="${req.body.unfriendemail}"`,
      function (err, result, fields) {
        if (err) throw err;
        if (session) {
          con.query(
            `DELETE FROM ${session.tablename}flist WHERE email="${req.body.unfriendemail}"`,
            function (err, result, fields) {
              if (err) throw err;
              res.json({ status: "unfriended" });
            }
          );
        } else {
          res.json({
            status: "Not logged In",
          });
        }
      }
    );
  } else {
    res.json({
      status: "Not logged In",
    });
  }
});

app.post("/newpost", (req, res) => {
  if (session) {
    con.query(
      `INSERT INTO ${session.tablename}post (content, date, time, likes, postId) VALUES ("${req.body.message}", "${req.body.date}", "${req.body.time}", 0, "${req.body.postId}")`,
      function (err, result) {
        if (err) throw err;
        res.json({
          status: "successfully posted",
        });
      }
    );
  } else {
    res.json({
      status: "Not logged In",
    });
  }
});

app.post("/likepost", (req, res) => {
  if (session) {
    con.query(`SELECT * FROM signup`, function (err, result1, fields) {
      if (err) throw err;
      result1.map((val, index) => {
        let b = val.email.split("@");
        let c = b[1].split(".");
        let tablename = b[0] + c[0] + c[1] + "";

        if (session) {
          con.query(
            `SELECT * FROM ${tablename}post`,
            function (err, result2, fields) {
              if (err) throw err;
              result2.map((value, idx) => {
                if (value.postId == req.body.postId) {
                  let newLike = value.likes + 1;
                  con.query(
                    `UPDATE ${tablename}post SET likes = ${newLike} WHERE postId = "${req.body.postId}"`,
                    function (err, result) {
                      if (err) throw err;
                      res.json({ status: "LIKED", content: value, name: b[0] });
                    }
                  );
                }
              });
            }
          );
        } else {
          res.json({
            status: "Not logged In",
          });
        }
      });
    });
  } else {
    res.json({
      status: "Not logged In",
    });
  }
});

app.post("/dislikepost", (req, res) => {
  if (session) {
    con.query(`SELECT * FROM signup`, function (err, result1, fields) {
      if (err) throw err;
      result1.map((val, index) => {
        let b = val.email.split("@");
        let c = b[1].split(".");
        let tablename = b[0] + c[0] + c[1] + "";

        if (session) {
          con.query(
            `SELECT * FROM ${tablename}post`,
            function (err, result2, fields) {
              if (err) throw err;
              result2.map((value, idx) => {
                if (value.postId == req.body.postId) {
                  let newLike = value.likes - 1;
                  con.query(
                    `UPDATE ${tablename}post SET likes = ${newLike} WHERE postId = "${req.body.postId}"`,
                    function (err, result) {
                      if (err) throw err;
                      res.json({ status: "UNLIKED" });
                    }
                  );
                }
              });
            }
          );
        } else {
          res.json({
            status: "Not logged In",
          });
        }
      });
    });
  } else {
    res.json({
      status: "Not logged In",
    });
  }
});

// app.post("/postfeed", (req, res) => {
//   let b = req.body.email.split("@");
//   let c = b[1].split(".");
//   let tablename = b[0] + c[0] + c[1] + "";
//   con.query(`SELECT * FROM ${tablename}flist`, function (err, result1, fields) {
//     if (err) throw err;
//     con.query(
//       `SELECT * FROM ${tablename}post`,
//       function (err, result2, fields) {
//         if (err) throw err;
//         if (session) {
//           con.query(
//             `SELECT * FROM ${session.tablename}flist`,
//             function (err, result3, fields) {
//               if (err) throw err;
//               res.json({
//                 status: "FETCHED",
//                 friendslength: result1.length,
//                 postlength: result2.length,
//                 result1,
//                 result2,
//                 result3,
//               });
//             }
//           );
//         } else {
//           res.json({
//             status: "Not logged In",
//           });
//         }
//       }
//     );
//   });
// });

app.get("/logout", (req, res) => {
  req.session.destroy();
  session = undefined;
  res.json({ status: "logout successful" });
});

app.listen(5000, () => {
  console.log("Started");
});
