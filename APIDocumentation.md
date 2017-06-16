# Stove: API Documentation
---
## User API

### Sign Up (i.e create user)

- description: create a new user and store in database
- request: `POST /api/users/`
    - content-type: `application/json`
    - body: object
      - email: (string) email of the new user
      - password: (string) password of the new user
      - firstName: (string) first name of the new user
      - lastName: (string) last name of the new user
      - city: (string) city of the new user
      - country: (string) country of the new user


- response: 200
    - content-type: `application/json`
    - body: object
      - \_id: (string) the user id
      - firstName: (string) first name of the user
      - lastName: (string) last name of the user
      - email: (string) email of the user
      - city: (string) city of the user
      - country: (string) country of the user
- response 409
    - body: User with email :email already exists
- response 500
    - Request End

##### Terminal Command to Sign Up

```
$ curl -X POST -H "Content-Type:application/json" -d '{"email":"sheldon@bigbang.com","password":"pass4shelly", "firstName":"Sheldon", "lastName":"Cooper", "city":"Pasadena", "country":"US"}' https://mia-stove.herokuapp.com/api/users/
```

### Sign In - Without Facebook (Read)

- description: create an session for authenticated user
- request: `POST /api/signin/`
  - content-type: `application/json`
  - body: object
    - email: (string) username of the new user
    - password: (string) of the new user


- response: 200
  - content-type: `application/json`
  - set-cookie: connect.sid
  - set-cookie: user_id
  - body: object
    - \_id: (string) the user id
    - firstName: (string) first name of the user
    - lastName: (string) last name of the user
    - email: (string) email of the user
    - city: (string) city of the user
    - country: (string) country of the user
- response 401
  - body: Unauthorized
- response 500
  - Request End
- response 400
  - body: Bad Request

##### Terminal Command to Sign In without Facebook

```
$ curl -X POST -H "Content-Type:application/json" -d '{"email":"s@bigbang.com","password":"123"}' -b cookie.txt -c cookie.txt https://mia-stove.herokuapp.com/api/signin
```

### Sign In - With Facebook (Read)

- description: create an session for authenticated user using Facebook authentication
- request: `POST /api/signinFB/`
  - content-type: `application/json`
  - body: object
  - email: (string) username of the new user
  - id: (string) Facebook id of the user that has been authenticated by Facebook
  - first_name: (string) first name of the user that has been authenticated by Facebook
  - last_name: (string) last name of the user that has been authenticated by Facebook


- response: 200
  - content-type: `application/json`
  - set-cookie: connect.sid
  - set-cookie: user_id
  - body: object
    - \_id: (string) the user id
    - firstName: (string) first name of the user
    - lastName: (string) last name of the user
    - email: (string) email of the user
    - city: (string) city of the user
    - country: (string) country of the user
- response 500
  - Request End
- response 400
  - body: Bad Request

##### Terminal Command to Sign In using Facebook authentication

```
$ curl -X POST -H "Content-Type:application/json" -d '{"email":"s@bigbang.com","password":"123"}' -b cookie.txt -c cookie.txt https://mia-stove.herokuapp.com/api/signin
```

### Update
- description: updates an existing user's information in stove's database
- request: `PUT /api/users/`
    - content-type: `application/json`
    - body: object
      - \_id: (string) the user id
      - email: (string) **new** email of the new user
      - firstName: (string) **new** first name of the new user
      - lastName: (string) **new** last name of the new user
      - city: (string) **new** city of the new user
      - country: (string) **new** country of the new user


- response: 200
    - content-type: `application/json`
    - body: object
      - \_id: (string) the user id
      - firstName: (string) **updated** first name of the user
      - lastName: (string) **updated** last name of the user
      - email: (string) **updated** email of the user
      - city: (string) **updated** city of the user
      - country: (string) **updated** country of the user
- response 403
    - body: Forbidden
- response 500
    - Request End

##### Terminal Command to Sign Up

```
$ curl -X PUT -H "Content-Type:application/json" -d '{"email":"sheldon@bigbang.com", "firstName":"Sheldon", "lastName":"Golden", "city":"Pasadena", "country":"US", "_id":"58d52ec0c85e2a2351f15836"}' -b cookie.txt -c cookie.txt https://mia-stove.herokuapp.com/api/users/
```

### Sign Out (delete a session)

- description: destory an current session for authenicated user
- request: `DELETE /api/signout/`


- response: 200
    - session end
- response 500
    - Request End

##### Terminal Command to Sign Out

```
$ curl -X DELETE -H "Content-Type:application/json" -b cookie.txt -c cookie.txt https://mia-stove.herokuapp.com/api/signout
```

### Current User (additional read)

- description: retrieve the information about user based on the session
- request: `GET /api/current/`


- response: 200
    - content-type: `application/json`
    - body: object
      - \_id: (string) the user id
      - firstName: (string) first name of the user
      - lastName: (string) last name of the user
      - email: (string) email of the user
      - city: (string) city of the user
      - country: (string) country of the user
  - response: 403
    - body: Forbidden

##### Terminal Command to Get the Current User Info

```
$ curl -b cookie.txt -c cookie.txt https://mia-stove.herokuapp.com/api/current/
```

## Suggestion API

### Create

- description: create a suggestion based on the infomtion provided in the body of the cal
- request: `POST /api/spin/`
- content-type: `application/json`
- body:
  - location: (string) represents city or specific address or postal code that is valided by google
  - term: (string) represents a term to narrow down yelp search option like sushi, pizza or coffee.


- response: 200
  - content-type: `application/json`
  - body: object
    - Note: the response connect is same as yelp response you can refer to yelp response value description [here](https://www.yelp.ca/developers/documentation/v2/search_api). Below are some important value and their description
    - yelp_id: (string) represents yelp of the suggestion.
    - name: (string) represents the name of the suggestion place.name,
    - address: (string) represents t(he address of the suggestion
    - image: (string) represents link to image of the suggestion,
    - url: (string) represents link to the yelp profile of the suggestion
- response: 403
  - body: Forbidden


##### Terminal Command to Generate Suggestion with location parameter

```
 $ curl -X POST -H "Content-Type:application/json" -d '{"location":"New York","term":""}' -b cookie.txt -c cookie.txt https://mia-stove.herokuapp.com/api/spin/
```

##### Terminal Command to Generate Suggestion with term parameter

```
 $ curl -X POST -H "Content-Type:application/json" -d '{"location":"New York","term":"Sushi"}' -b cookie.txt -c cookie.txt https://mia-stove.herokuapp.com/api/spin/
```


### Read

- description: retrieve history of a user based on the page number. 0 Page is first 10 comments, page 1 is next 10 comments and so on
- request: `GET /api/history/:id/:pagenum/`   
- response: 200
    - content-type: `application/json`
    - body: list of objects
    - \_id: (string) the history id
    - user_id: (string) represents id of the user to who the suggestion was made
    - yelp_id: (string) represents yelp of the suggestion.
    - name: (string) represents the name of the suggestion place.name,
    - address: (string) represents t(he address of the suggestion
    - image: (string) represents link to image of the suggestion,
    - url: (string) represents link to the yelp profile of the suggestion
- response: 403
  - body: Forbidden
- response: 404
  - body: "Post id :id does not exists"

##### Terminal Command to get a History of Suggestion

```
$ curl -b cookie.txt -c cookie.txt -k https://mia-stove.herokuapp.com/api/history/58d52ec0c85e2a2351f15836/0/
```


## Additional API Calls

### Current Location

- description: sets the current location of the user for precise suggestion generation
- request: `PUT /api/setlocation/`
  - content-type: `application/json`
  - Body:
    - city: (string) current city from where the user is accessing
    - country: (string) current country from where the user us accessing


- response: 200
- content-type: `application/json`
  - body: object
    - \_id: (string) the user id
    - firstName: (string) first name of the user
    - lastName: (string) last name of the user
    - email: (string) email of the user
    - city: (string) **updated** city of the user
    - country: (string) **updated** country of the user
- response: 403
  - body: Forbidden
