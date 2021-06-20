const model = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { updateTask } = require("../utils/updateTask");
const {
  registerValidation,
  loginValidation,
  taskValidation,
  editTaskValidation,
} = require("../validations/userValidation");

async function register(req, res) {
  let { error } = await registerValidation(req.body);
  if (error) {
    return res.json({
      msg: error.details[0].message,
      status: 406,
    });
  } else {
    const findByUser = await model.find({ username: req.body.username });
    if (findByUser.length > 0) {
      return res.json({
        msg: "this username already used!",
        status: 406,
      });
    }

    const encryptPass = await bcrypt.hash(req.body.password, 10);
    const body = {
      username: req.body.username,
      password: encryptPass,
      tasks: req.body.tasks,
      isAdmin: req.body.isAdmin,
      picture: req.body.picture,
    };
    const data = await new model(body);
    data
      .save()
      .then((r) => {
        res.json({ status: 201 });
      })
      .catch((er) => {
        res.json({ status: 406, msg: er });
      });
  }
}

async function login(req, res) {
  let { error } = await loginValidation(req.body);
  if (error) {
    return res.json({
      msg: error.details[0].message,
      status: 406,
    });
  } else {
    const findByUser = await model.findOne({ username: req.body.username });
    if (!findByUser) {
      return res.json({
        msg: "cant find user with this username",
        status: 404,
      });
    } else {
      let comparePass = await bcrypt.compare(
        req.body.password,
        findByUser.password
      );
      if (!comparePass) {
        return res.json({
          msg: "password dont match!",
          status: 406,
        });
      }
      const today = new Date();
      const tomorrow = new Date(today);
      let exp = tomorrow.setDate(tomorrow.getDate() + 1);
      const token = await jwt.sign(
        { token: findByUser, exp },
        process.env.ACCESS_TOKEN
      );

      res.json({
        status: 200,
        data: {
          token,
        },
      });
    }
  }
}

async function addTask(req, res) {
  let { uuid } = req.params;
  if (!uuid) {
    return res.json({
      msg: "please complete required parametr",
      status: 406,
    });
  } else {
    let find = await model.findOne({ uuid });
    if (!find) {
      return res.json({
        msg: "cannot find user with this uuid",
        status: 200,
      });
    } else {
      let { error } = await taskValidation(req.body);
      if (error) {
        return res.json({
          msg: error.details[0].message,
          status: 406,
        });
      } else {
        let { endTime, title, status } = req.body;
        if (!endTime) {
          await model.updateOne(
            { uuid },
            {
              $push: {
                tasks: { title, status },
              },
            }
          );

          res.json({
            msg: "add task successful!",
            status: 200,
          });
        } else {
          await model.updateOne(
            { uuid },
            {
              $push: {
                tasks: { title, status, endTime },
              },
            }
          );

          res.json({
            msg: "add task successful!",
            status: 200,
          });
        }
      }
    }
  }
}

async function editTask(req, res) {
  let { uuid, uuidTask } = req.params;
  if (!uuid || !uuidTask)
    return res.json({
      msg: "please complete required parametr",
      status: 406,
    });
  else {
    let find = await model.findOne({ uuid });
    if (!find)
      return res.json({
        msg: "cannot find user with this uuid!",
        status: 404,
      });
    else {
      let { error } = await editTaskValidation(req.body);
      if (error) {
        return res.json({
          msg: error.details[0].message,
          status: 406,
        });
      } else {
        let { title, endTime, status } = req.body;
        let { tasks } = find;
        let allTasks = tasks.filter((item) => item.uuid !== uuidTask);
        let filterOne = tasks.filter((item) => item.uuid === uuidTask)[0];

        if (!filterOne) {
          return res.json({
            msg: "cannot find task with this task uuid",
            status: 404,
          });
        } else {
          if (title && !endTime && !status) {
            filterOne.title = title;
            return updateTask(allTasks, filterOne, uuid)
              .then((response) => res.json(response))
              .catch((er) => res.json(er));
          }
          if (!title && endTime && !status) {
            filterOne.endTime = endTime;
            return updateTask(allTasks, filterOne, uuid)
              .then((response) => res.json(response))
              .catch((er) => res.json(er));
          } else {
            filterOne.status = status;
            return updateTask(allTasks, filterOne, uuid)
              .then((r) => res.json(r))
              .catch((er) => res.json(er));
          }
        }
      }
    }
  }
}

async function deleteTask(req, res) {
  const { uuid, uuidTask } = req.params;
  if (!uuid || !uuidTask) {
    return res.json({
      msg: "please complete required parametr!",
      status: 406,
    });
  } else {
    const find = await model.findOne({ uuid });
    if (!find) {
      return res.json({
        msg: "cannot find user with this uuid!",
        status: 404,
      });
    } else {
      let { tasks } = find;
      let findTask = tasks.some((item) => item.uuid === uuidTask);
      if (!findTask) {
        return res.json({
          msg: "cannot find task with this uuid task",
          status: 404,
        });
      } else {
        let filteredTasks = tasks.filter((item) => item.uuid !== uuidTask);
        await model.updateOne(
          { uuid },
          {
            $set: { tasks: filteredTasks },
          },
          {},
          (error) => {
            if (error)
              return res.json({
                msg: "cannot delete tasks!",
                status: 503,
              });

            res.json({
              status: 200,
              msg: "delete task successful",
            });
          }
        );
      }
    }
  }
}

async function logout(req, res) {
  const { uuid } = req.params;
  if (!uuid) {
    return res.json({
      msg: "please complete required parametr!",
      status: 406,
    });
  } else {
    const findUser = await model.findOne({ uuid });
    if (!findUser) {
      return res.json({
        msg: "cannot find user with thid uuid",
        status: 404,
      });
    } else {
      await model.deleteOne({ uuid }, (error) => {
        if (error)
          return res.json({
            msg: "cannot delete user!",
            status: 503,
          });

        res.json({
          status: 200,
          msg: "delete user successful!",
        });
      });
    }
  }
}

async function getTasks(req, res) {
  const { uuid } = req.params;
  if (!uuid) {
    return res.json({
      status: 400,
      msg: "please provide required params!",
    });
  } else {
    const findByUu = await model.find({ uuid });
    if (findByUu.length <= 0) {
      return res.json({
        status: 404,
        msg: "can't find user with this uuid",
      });
    } else {
      res.json({
        status: 200,
        tasks: findByUu[0].tasks,
      });
    }
  }
}

async function getUserPicture(req, res) {
  const { uuid } = req.params;
  if (!uuid) {
    return res.json({
      status: 400,
      msg: "please complete required params",
    });
  } else {
    let findUser = await model.find({ uuid });
    if (findUser.length <= 0) {
      return res.json({
        msg: "can't find user with this uuid",
        status: 404,
      });
    }
    res.json({
      status: 200,
      base64: findUser[0].picture,
    });
  }
}

module.exports = {
  register,
  login,
  addTask,
  editTask,
  deleteTask,
  logout,
  getTasks,
  getUserPicture,
};
