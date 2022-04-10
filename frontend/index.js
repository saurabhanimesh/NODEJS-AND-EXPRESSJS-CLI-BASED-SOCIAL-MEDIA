const program = require("commander");
const inquirer = require("inquirer");
const axios = require("axios");
const express = require("express");
const app = express();
var cookieParser = require("cookie-parser");

app.use(cookieParser());

program.version("1.0.0");

program
  .command("signup")
  .description("sign up the user")
  .alias("su")
  .action(() => {
    accountCreation();
  });

program
  .command("login")
  .description("log in the user")
  .alias("li")
  .option("--username <username>", "checking username from database")
  .option("--password <password>", "checking password from database")
  .action((value) => {
    accountLogin(value);
  });

program
  .command("friends")
  .description("get friends of user")
  .alias("frs")
  .action(() => {
    getFriends();
  });

program
  .command("pending_request")
  .description("get friends of user")
  .option("--accept <emaila>", "accepts pending friend request")
  .option("--reject <emailr>", "rejects pending friend request")
  .alias("pr")
  .action((val) => {
    pendingAction(val);
  });

program
  .command("show_profile <fdata>")
  .description("see profile of friends")
  .alias("fp")
  .action((val) => {
    friendsProfile(val);
  });

program
  .description("search friends of user")
  .option("--filter <sdata>", "search the friends")
  .action((val) => {
    searchFriends(val);
  });

program
  .description("unfriend the friends")
  .option("--unfriend <ufemail>", "unfriend the friends")
  .action((val) => {
    unFriend(val);
  });

// program
//   .command("post")
//   .description("post feed")
//   .option("--friend <fname>", "display the posts of searched friend")
//   .option("--count", "display the count of the posts")
//   .option("--page", "display all the next 15-30 posts on next page")
//   .option("--mine", "display all self posts")
//   .action((val) => {
//     newPost(val);
//   });

program
  .command("post")
  .description("post feed")
  .option("--new-post", "new post")
  .option("--like <postId>", "like any friend's post")
  .option("--dislike <postId>", "dislike any friend's post")
  .action((val) => {
    newPost(val);
  });

program
  .command("logout")
  .description("logout")
  .action(() => {
    logout();
  });

const accountCreation = () => {
  inquirer
    .prompt([
      { type: "input", name: "name", message: "please enter your name: " },
      { type: "input", name: "email", message: "please enter your email: " },
      {
        type: "input",
        name: "password",
        message: "please enter your password: ",
      },
      {
        type: "input",
        name: "password",
        message: "please confirm your password: ",
      },
      {
        type: "input",
        name: "nickname",
        message: "please enter your nickname: ",
      },
    ])
    .then((answers) => {
      axios
        .post("http://localhost:5000/signup", {
          name: answers.name,
          email: answers.email,
          password: answers.password,
          nickname: answers.nickname,
        })
        .then(function (response) {
          console.log(response.data);
          console.log("Sign up Successful");
        })
        .catch(function (error) {
          console.log(error);
        });
    });
};

const accountLogin = (value) => {
  value.username && value.password
    ? axios
        .post("http://localhost:5000/login", {
          username: value.username,
          password: value.password,
        })
        .then((res) => {
          console.log(res.data);
          console.log("Login Successful");
          // axios.get("http://localhost:5000/dashboard").then((res) => {
          //   if (res.data.status == "login successful") {
          //     axios.get("http://localhost:6500/dashboard");
          //     app.get("/dashboard", (req, res) => {
          //       res.cookie(`${value.username}`, { username: value.username });
          //       res.send("Logged In as " + value.username);
          //     });
          //     console.log("Logged In Successfully");
          //   } else {
          //     axios.get("http://localhost:6500/dashboard");
          //     app.get("/dashboard", (req, res) => {
          //       res.send("Please Login With Correct Username and Password");
          //     });
          //     console.log("Logging In Unsucessfull");
          //   }
          // });
        })
        .catch((err) => {})
    : console.log("Username or Password Missing");
};

const getFriends = () => {
  axios
    .get("http://localhost:5000/friends")
    .then((res) => {
      if (res.data.status == "Not logged In") {
        console.log("Please Login First");
      } else {
        let arr = res.data;
        console.log("Friends Count: " + arr.length);
        arr.map((val, index) => {
          console.log(val.email + " " + val.name);
        });
      }
    })
    .catch((err) => {
      console.log("Something went wrong");
    });

  axios
    .get("http://localhost:5000/pendingrequest")
    .then((res) => {
      if (res.data.status == "Not logged In") {
      } else {
        let arr = res.data;
        console.log("");
        console.log("Pending request: " + arr.length);
        arr.map((val, index) => {
          console.log(val.email + " " + val.name);
        });
      }
    })
    .catch((err) => {
      console.log("Something went wrong");
    });
};

const pendingAction = (value) => {
  value.accept || value.reject
    ? value.accept
      ? axios
          .post("http://localhost:5000/pendingrequestaccept", {
            email: value.accept,
          })
          .then((res) => {
            console.log(res.data);
            if (res.data.status == "done") {
              console.log("ACCEPTED " + value.accept);
            } else if (res.data.status == "no request present") {
              console.log("No Request Present from " + value.accept);
            } else {
              console.log("Please Login First");
            }
          })
          .catch((err) => {})
      : axios
          .post("http://localhost:5000/pendingrequestreject", {
            email: value.reject,
          })
          .then((res) => {
            if (res.data.status == "done") {
              console.log("REJECTED " + value.reject);
            } else if (res.data.status == "no request present") {
              console.log("No Request Present from " + value.accept);
            } else {
              console.log("Please Login First");
            }
          })
          .catch((err) => {
            console.log("Something went wrong");
          })
    : console.log("No email entered");
};

const searchFriends = (value) => {
  value.filter
    ? axios
        .post("http://localhost:5000/searchfriends", {
          fdata: value.filter,
        })
        .then((res) => {
          if (res.data.status == "DATA FOUND") {
            console.log("Found " + res.data.length + ` ${value.filter}`);
          } else if (res.data.status == "Not logged In") {
            console.log("Please Login First");
          } else {
            console.log("No Such Friend Exists");
          }
          // console.log(res.data["0"]);
        })
        .catch((err) => {
          console.log("Something went wrong");
        })
    : console.log("No email entered");
};

const friendsProfile = (value) => {
  value
    ? axios
        .post("http://localhost:5000/friendsprofile", {
          email: value,
        })
        .then((res) => {
          let mutualcount = 0;
          if (res.data.status == "FETCHED") {
            res.data.result1.map((val1, index1) => {
              res.data.result3.map((val2, index2) => {
                if (val1.email == val2.email) {
                  mutualcount = mutualcount + 1;
                }
              });
            });
            console.log("friends count : " + res.data.friendslength);
            console.log("mutual friends : " + mutualcount);
            console.log("post count : " + res.data.postlength);
            console.log("Recent 10 post:");
            res.data.result2.map((val, index) => {
              if (index <= 9) {
                console.log(`${index + 1}.` + val.content);
                console.log("[Date:time] " + "Like:" + val.likes);
              } else {
              }
            });
            // console.log(res.data);
          } else if (res.data.status == "Not logged In") {
            console.log("Please Login First");
          } else {
            console.log("No Such Friend Exists");
          }
          // console.log(res.data["0"]);
        })
        .catch((err) => {
          console.log("Something went wrong");
        })
    : console.log("Please enter friend details");
};

const unFriend = (value) => {
  value.unfriend
    ? inquirer
        .prompt([
          { type: "input", name: "confirm", message: "Are you sure? YES/NO" },
        ])
        .then((answers) => {
          if (answers.confirm == "YES") {
            axios
              .post("http://localhost:5000/unfriend", {
                unfriendemail: value.unfriend,
              })
              .then((res) => {
                if (res.data.status == "unfriended") {
                  console.log(value.unFriend + " unfriended");
                } else if (res.data.status == "Not logged In") {
                  console.log("Please Login First");
                } else {
                  console.log("No Such Friend Exists");
                }
              })
              .catch((err) => {
                console.log("Something went wrong");
              });
          }
        })
    : value.filter
    ? axios
        .post("http://localhost:5000/searchfriends", {
          fdata: value.filter,
        })
        .then((res) => {
          if (res.data.status == "DATA FOUND") {
            console.log("Found " + res.data.length + ` ${value.filter}`);
          } else if (res.data.status == "Not logged In") {
            console.log("Please Login First");
          } else {
            console.log("No Such Friend Exists");
          }
        })
        .catch((err) => {
          console.log("Something went wrong");
        })
    : console.log("No email Entered");
};

function tConv24(time24) {
  var ts = time24;
  var H = +ts.substr(0, 2);
  var h = H % 12 || 12;
  h = h < 10 ? "0" + h : h; // leading 0 at the left for 1 digit hours
  var ampm = H < 12 ? " am" : " pm";
  ts = h + ts.substr(2, 3) + ampm;
  return ts;
}

const newPost = (value) => {
  value.like || value.dislike
    ? value.like
      ? axios
          .post("http://localhost:5000/likepost", {
            postId: value.like,
          })
          .then((res) => {
            if (res.data.status == "LIKED") {
              console.log("Liked post:");
              console.log("@" + res.data.name);
              console.log(res.data.content.content);
              console.log(
                "[" +
                  res.data.content.date +
                  " : " +
                  res.data.content.time +
                  "]" +
                  " Like:" +
                  res.data.content.likes +
                  " post-id:" +
                  res.data.content.postId
              );
            } else if (res.data.status == "Not logged In") {
              console.log("Please Login First");
            } else {
              resolve("HI");
            }
          })
          .catch((err) => {
            console.log("Something went wrong");
          })
      : axios
          .post("http://localhost:5000/dislikepost", {
            postId: value.dislike,
          })
          .then((res) => {
            if (res.data.status == "UNLIKED") {
              console.log("Post Disliked");
            } else if (res.data.status == "Not logged In") {
              console.log("Please Login First");
            } else {
            }
          })
          .catch((err) => {
            console.log("Something went wrong");
          })
    : inquirer
        .prompt([
          {
            type: "input",
            name: "message",
            message: "please enter your message:",
          },
        ])
        .then((answers) => {
          const d = new Date();
          const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];
          const postDate =
            d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
          const time =
            d.getHours().toString().length == 2
              ? d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds()
              : "0" +
                d.getHours() +
                ":" +
                d.getMinutes() +
                ":" +
                d.getSeconds();
          console.log(time);
          const postId = Math.floor(Math.random() * 100 + 1);
          if (answers.message) {
            axios
              .post("http://localhost:5000/newpost", {
                message: answers.message,
                date: postDate,
                time: tConv24(time),
                postId: postId,
              })
              .then((res) => {
                if ((res.data.status = "successfully posted")) {
                  console.log("successfully posted");
                } else if (res.data.status == "Not logged In") {
                  console.log("Please Login First");
                } else {
                  console.log("posting unsuccessful");
                }
              })
              .catch((err) => {
                console.log("Something went wrong");
              });
          }
        });
};

const logout = () => {
  axios
    .get("http://localhost:5000/logout")
    .then((res) => {
      console.log("logout successful");
    })
    .catch((err) => {
      console.log("Something went wrong");
    });
};

// const postFeed = (value) => {
//   axios
//     .post("http://localhost:5000/postfeed", {
//       email: value,
//     })
//     .then((res) => {
//       if (res.data.status == "FETCHED") {
//       } else if (res.data.status == "Not logged In") {
//         console.log("Please Login First");
//       } else {
//         console.log("No Such Friend Exists");
//       }
//     })
//     .catch((err) => {
//       console.log("Something went wrong");
//     });
// };

program.parse(process.argv);

// app.listen(6500);
