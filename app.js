const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
var format = require("date-fns/format");
var isValid = require("date-fns/isValid");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

// return all Todos whose status is TODO

app.get("/todos/", async (request, response) => {
  const { status, priority, category, search_q } = request.query;
  if (status !== undefined) {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      const getTodoSQuery = `
                SELECT *
                FROM todo
                WHERE status = '${status}';
            `;
      const dbTodoSList = await db.all(getTodoSQuery);
      response.send(
        dbTodoSList.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
      );
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }
  // return all todos whose Priority is HIGH
  else if (priority !== undefined) {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      const getTodoSQuery = `
                SELECT *
                FROM todo
                WHERE priority = '${priority}';
            `;
      const dbTodoSList = await db.all(getTodoSQuery);
      response.send(
        dbTodoSList.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
      );
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
  //returns list of todos using category
  else if (category !== undefined) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      const getTodoSQuery = `
                SELECT *
                FROM todo
                WHERE category = '${category}';
            `;
      const dbTodoSList = await db.all(getTodoSQuery);
      response.send(
        dbTodoSList.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
      );
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
  // returns list of all todos using search_q
  else if (search_q !== undefined) {
    const getTodoSQuery = `
        SELECT *
        FROM todo
        WHERE todo LIKE "%${search_q}%";
      `;
    const dbTodoSList = await db.all(getTodoSQuery);
    response.send(
      dbTodoSList.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
    );
  }
});

// API-2 get a specific TodoId
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const GetSpecificId = `SELECT
                           *
                        FROM
                          todo
                        WHERE
                          id = ${todoId};`;
  const specificIDres = await db.get(GetSpecificId);
  response.send(convertDbObjectToResponseObject(specificIDres));
});

//returns list of all todos with a specific due date
app.get("/agenda/", async (request, response) => {
  const { date } = request.query; // destructuring the date
  let dateObject = new Date(date); // create a new date
  let isDateValid = isValid(dateObject); // validating

  if (isDateValid === true) {
    let date1 = dateObject.getDate();
    let month1 = dateObject.getMonth();
    let year1 = dateObject.getFullYear();
    const formatDate = format(new Date(year1, month1, date1), "yyyy-MM-dd"); // date: 9/12/2022
    const getDuedateQuery = `SELECT
                                *
                             FROM
                               todo
                             WHERE 
                                 due_date = '${formatDate}';`;
    const getDuedateres = await db.all(getDuedateQuery);
    response.send(
      getDuedateres.map((eachObject) =>
        convertDbObjectToResponseObject(eachObject)
      )
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//creating a todo in the todo table
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  let status1 = null;
  let priority1 = null;
  let category1 = null;
  let dueDate1 = null;
  let dateObj = new Date(dueDate);
  const isDateValid = isValid(dateObj);
  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    status1 = status;
  } else {
    status1 = undefined;
    response.status(400);
    response.send("Invalid Todo Status");
  }
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    priority1 = priority;
  } else {
    priority1 = undefined;
    response.status(400);
    response.send("Invalid Todo Priority");
  }
  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    category1 = category;
  } else {
    category1 = undefined;
    response.status(400);
    response.send("Invalid Todo Category");
  }
  if (isDateValid === true) {
    let year1 = dateObj.getFullYear();
    let month1 = dateObj.getMonth();
    let date1 = dateObj.getDate();
    let formatDate = format(new Date(year1, month1, date1), "yyyy-MM-dd");
    dueDate1 = formatDate;
  } else {
    dueDate1 = undefined;
    response.status(400);
    response.send("Invalid Due Date");
  }

  // the below if condition is optional
  if (
    id !== undefined &&
    todo !== undefined &&
    priority1 !== undefined &&
    status1 !== undefined &&
    category1 !== undefined &&
    dueDate1 !== undefined
  ) {
    const creatingTodo = `
        INSERT INTO todo(id,todo,priority,status,category,due_date) 
        VALUES (${id},'${todo}','${priority1}','${status1}','${category1}','${dueDate1}');
    `;
    await db.run(creatingTodo);
    response.send("Todo Successfully Added");
  }
});

// Update the details of a specific Todo id
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;

  // status :"Done" scenario1
  if (status !== undefined) {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      const UpdateTodo = `UPDATE
                               todo
                             SET 
                               status = '${status}'
                             WHERE 
                               id = ${todoId}`;
      await db.run(UpdateTodo);
      response.send("Status Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (priority !== undefined) {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      const UpdatingPriority = `UPDATE
                                  todo
                                SET
                                  priority = '${priority}'
                                WHERE
                                  id = ${todoId}`;
      const PriorityUpdated = db.run(UpdatingPriority);
      response.send("Priority Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (todo !== undefined) {
    const updateTodoQuery = `
            UPDATE todo
            SET todo = '${todo}'
            WHERE id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send("Todo Updated");
  } else if (category !== undefined) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      const updatingTodoQuery = `
            UPDATE todo
            SET category = '${category}'
            WHERE id = ${todoId};
        `;
      await db.run(updatingTodoQuery);
      response.send("Category Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (dueDate !== undefined) {
    let dateObj = new Date(dueDate);
    const isDateValid = isValid(dateObj);
    if (isDateValid === true) {
      let date1 = dateObj.getDate();
      let month1 = dateObj.getMonth();
      let year1 = dateObj.getFullYear();
      const formatDate = format(new Date(year1, month1, date1), "yyyy-MM-dd");
      const updateTodoQuery = `
            UPDATE todo
            SET due_date = '${formatDate}'
            WHERE id = ${todoId};
        `;
      await db.run(updateTodoQuery);
      response.send("Due Date Updated");
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

// delete a  todo based on the todo Id
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `DELETE
                        FROM
                           todo
                        WHERE 
                           id = ${todoId}`;
  await db.run(deleteTodo);
  response.send("Todo Deleted");
});

module.exports = app;
