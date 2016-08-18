# ng-next

Ng-next is a simple and elegant way to use Angular 1.x with ES6 / ES7. It provides an expressive syntax to maintain the simplicity and readability of your code.

* **Decorators for angular & ui-router**
* **Async / Await integration to make it compatible with angular's $digest cycle**
* **Monkey patch for `$scope.$watchCollection` to work with ES6 iterables (Set / Map / Symbol.iterator)**

## Requirements

* **Angular 1.x**

> Note: In order to use Angular UI-Router specific decorators, you need to install [Angular UI-Router](https://github.com/angular-ui/ui-router) first.

## Installation

### NPM
Ng-next is available on [npm](https://www.npmjs.com/package/ng-next)  
```
npm install --save ng-next
```

### Angular Module
Make sure you define your angular module **before**

Then simply import the package like this:

 ```javascript
 import "ng-next"
 ```
Ng-next **relies on `ng-app`** to fetch your angular module.  
Alternatively you can define it on the `config` object.

### Babel & Decorators

For the full list of ECMAScript 2015 features, please refer to the [Babel Documentation](http://babeljs.io/docs/learn-es2015/).

If you want to use decorators please install [Babel support for decoratos](https://github.com/loganfsmyth/babel-plugin-transform-decorators-legacy)

## Async / Await

Making asynchronous http requests was until now a bit of a hassle. Ng-next provides therefore an elegant and convenient way to achieve the same result.
Ng-next makes use of the ES6 `async / await` functions.

```javascript
async getUsers() {

  this.user = await this.UserService.index();

}
```

You don't have to manually call the `$rootScope.$digest()` after every asynchronous http requests you make.
This is achieved by injecting proxies into the default `Promise` class, which is used by `async / await`.
The proxies get injected into `Promise` the first time you call `import "ng-next"`. Magic!

#### Debounce $digest

Be aware of the amount of `async / await` or `Promise.then` statements you use in your project. High usage can cause slight performance issues.
In this case you can limit all `$rootScope.$digest()` calls by setting a minimum duration that has to pass before `$rootScope` gets $digested again.

```javascript
import {config} from "ng-next"
config.DEBOUNCE_DIGEST_MILLIS = [millis] //Debounce for [millis]
config.DEBOUNCE_DIGEST_MILLIS = false   //Disable debounce
```

## $scope.$watchCollection
Ng-next monkey patches `$scope.$watchCollection` of every scope to make it compatible with any iterable object.  
With this technique you can use `ng-repeat` and similiar directives with a `Set` or any object that has a `[Symbol.iterator]` method.
```javascript
import {Controller} from "ng-next"

@Controller
export class ListController
{
	list = new Set(["1", "2", "3", "4", "5"])

	[Symbol.iterator]()
	{
		return list[Symbol.iterator]();
	}
}

//Html
<div ng-controller="ListController as listCtrl">
	<h1>Iterate over Set</h1>
	<h2 ng-repeat="item in listCtrl.list">{{ item }}</h2>

	<h1>Iterate over controller</h1>
	<h2 ng-repeat="item in listCtrl">{{ item }}</h2>
</div>
```

## Decorators
Angular configuration decorators
* `@Controller`
* `@Service`
* `@Component`
* `@Directive`
* `@Filter`
* `@Config / @Run`

Utility decorators
* `@Inject`
* `@Init`
* `@Destroy`
* `@On`
* `@Watch`
* `@WatchCollection`
* `@Debounce`

Other decorators
* `@State`
* `@Alias`
* `@View`
* `@Bind`

### Angular configuration decorators

#### `@Controller`
```javascript
import {Controller} from "ng-next"

@Controller
export class FooController
{
	@Inject $http;
}

@Controller("BarController") //Minify safe
export class BarController
{
	@Inject $rootScope;
}
```

#### `@Service`
```javascript
import {Service} from "ng-next"

@Service
export class FooService { }

@Service("BarService") //Minify safe
export class BarService { }
```

#### `@Component`
`@Component` is placed directly on top of its controller!

```javascript
import {Component, View, Alias, Bind} from "ng-next"

/**
 * Component with decorators
 */
@Component("bar") //<bar></bar> Same as @Component({ name : "bar" })
@Alias("barCtrl")
@View("<h1>{{ barCtrl.foo }}</h1>")
export class BarComponent
{
	@Bind("=") foo;

	constructor() {
		console.log(this.foo);
	}
}

/**
 * More old-scool component.
 * The object given into the decorator is used as directive configuration
 * You may use every property a directive can have
 */
@Component({
	name : "foo",
	template : "<h1>{{ fooCtrl.bar }}</h1>"
	bind : {
		bar : "="
	},
	as : "fooCtrl"
}) //<foo> </foo>
export class FooComponent
{
	constructor() {
			console.log(this.bar);
		}
}
```

#### `@Directive`
```javascript
import {Directive} from "ng-next"

@Directive("foo") //<div foo> </div>
export class FooDirective
{

	restrict = "AE"
	scope = {
		bar : "="
	}
	link(...){}

}
```

#### `@Filter`
```javascript
import {Filter} from "ng-next"

export class Filters
{

	/**
	 * @ngInject
	 */
	@Filter //uses method name as filter name
	upper($http){
		return (string) => string.toUpperCase()
	}

	/**
	 * @ngInject
	 */
	@Filter("lower")
	lower($rootScope){
		return (string) => string.toLowerCase()
	}
}
}
```

#### `@Config / @Run`
```javascript
import {Config, Run} from "ng-next"

export class Configuration
{

	/**
	 * @ngInject
	 */
	@Run
	runSomething($rootScope){
		return (string) => string.toUpperCase()
	}

	/**
	 * @ngInject
	 */
	@Config
	configureSomething($httpProvider){
		//Config method
	}
}
```  

### Utility decorators
Those decorators should only be used on controllers and services.
For services ng-next will use the $rootScope as the scope for @On, @Watch etc.

```javascript
import {Inject, Controller, Init, Destroy, On, Watch, WatchCollection, Debounce}

@Controller
export class MainController
{
	/**
	 * Directly inject the angular http service
	 */
	@Inject $http;

	/**
	 * Directly inject the controller $scope
	 */
	@Inject $scope;

	/**
	 * Inject the $rootScope under an alias
	 */
	@Inject("$rootScope") baseScope;

	/**
	 * A random property
	 */
	property = "Hello World";

	/**
	 * A random array
	 */
	array = ["1", "hello", "red"];

	@Init //You cannot use await in constructors, so @Init is perfect for that
	async init()
	{
		let response = await this.$http.get("....");
	 //Do init stuff
	}

	@Destroy
	cleanUp()
	{
		//Cleanup when the controller / its scope gets destroyed
	}

	/**
	 * With @On you can listen to any event you can with $scope.$on
	 */
	@On("$stateChangeSuccess")
	stateChanged(event)
	{
		console.log("state changed", event)
	}

	/**
	 * With @Watch you can listen to any property as you would with $scope.$watch, but  
	 * its evaluateed on the controller instead of the scope
	 */
	@Watch("property")
	stateChanged(newValue, oldValue)
	{
		console.log(`Property changed from ${oldValue} to ${newValue}`)
	}

	/**
	 * With @WatchCollection you can listen to any property as you would with $scope.$watchCollection, but  
	 * its evaluateed on the controller instead of the scope
	 */
	@WatchCollection("array")
	stateChanged(newValue, oldValue)
	{
		console.log(`Array changed from ${oldValue} to ${newValue}`)
	}

	/**
	 * @Debounce will debounce the method for the given amount of millis
	 */
	@Debounce(100)
	oftenCalledMethod()
	{
		//I get executed after i wasn't called for 100 milliseconds
	}
}
```

### Other decorators

#### `@State`
The `@State` decorator defines a state for the common **`ui-router`** plugin and sets the class  
its on top of as controller.  
You can combine it with `@View / @Alias` or configure the state as you're used to.

```javascript
import {State, Alias, View}

@State({
	name : "user",
	url : "/user",
	default : true // Default state
})
@View("/views/user.html")
@Alias("userCtrl")
export class UserController
{
	//State controller
}

```

#### `@Alias`
Sets the controllerAs property of an `@Component` or `@State`

```javascript
import {Alias, State, Component}

@State(...)
@Alias("userCtrl")
export class UserController{ ... }

@Component("user")
@Alias("userCtrl")
export class UserComponent{ ... }

```

#### `@View`
Sets the template / templateUrl property of an `@Component` or `@State`, if the string contains a "<" it will be
treated as the HTML template, otherwise it will be considered as the path to the HTML template.

```javascript
import {View, State, Component}

@State(...)
@View("/views/user.html")
export class UserController{ ... }

@Component("user")
@View("<h1>Hello</h1>")
export class UserComponent{ ... }

```

#### `@Bind`
Defines a property / attribute which should be bound with the related component.
In this case the `user` component.

```javascript
import {Bind, Component, View}

@Component("user")
@View("<h1>{{ $ctrl.name }}</h1>")
export class UserComponent
{
	/**
	 * If the html is <user name="Dude"></user> then
	 * this property is "Dude"
	 */
	@Bind("@") name;
}

```


# Info
This little library is pretty new and under active development. Please report bugs and improvements :)

# License

The ng-next library is open-sourced software licensed under the [MIT License](https://opensource.org/licenses/MIT).
