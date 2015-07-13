# json-rest-server
A simple json REST server that exposes all json files contained in a directory tree.

## Install
npm install json-rest-server

## Example
Create a directory tree with sub directories and valid .json files like this:

```
myapi
├── blog/
│   ├── posts/
│   │	├── 1.json
│   │   ├── 1
│   │   │   ├── comments/
│   │   │   │   ├── 1.json
│   │   ├── 2.json
│   │   ├── 3.json
├── app/
│   ├── users.json
```

Start your server

```bash
$ json-rest-server myapi
```

Now if you go to [http://localhost:3000/blog/posts/1](), you'll get the content of 1.json inside posts

But if you go to [http://localhost:3000/blog/posts/1/comments](), you'll get an array with the content of all json files that are in the comments folder

## Routes
Like REST, you can have GET and POST on folders and GET, PUT and DELETE on json files. Based on previous example, you can have

```
GET    /blog/posts				-> ARRAY of json files conteined in myapi/blog/posts
GET    /blog/posts/1			-> JSON content of myapi/blog/posts/1.json
GET    /blog/posts/1/comments	-> ARRAY of json files conteined in myapi/blog/posts/1/comments
POST   /blog/posts				-> CREATE a new json file in myapi/blog/posts
PUT    /blog/posts/1			-> UPDATE content of myapi/blog/posts/1.json
PATCH  /blog/posts/1			-> UPDATE partial content of myapi/blog/posts/1.json
DELETE /blog/posts/1			-> DELETE file myapi/blog/posts/1.json
```

## Extras
It's an alternative to npm json-server
