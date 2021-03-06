import {angularInjector, module} from "./AngularModuleResolver"
import {config} from "./Configuration"
import * as symbols from "../util/Symbols"

/**
 * If the argument is an array (inject) this method
 * will return only the function with the $inject property
 * set
 * @param arg
 * @returns {Function}
 */
export function fetch(arg)
{
    if (arg.constructor == Array)
    {
        let arr = arg;
        arg = arr.splice(arr.length - 1, 1)[0];
        arg.$inject = arr;
    }
    return arg;
}

// Run block which will configure all annotations on any services available
// All services are used together with the $rootScope
/**
 * Exposes all services of a single module
 * @param module
 */
let exposeModule = module => {
    let $injector = angularInjector();
    let $rootScope = $injector.get("$rootScope");
    module._invokeQueue.forEach(item => {
        let def = item[2];
        if ($injector.has(def[0])) {
            let service = $injector.get(def[0]);
            callAnnotations(service, $rootScope);
        }
    });
};

//Await the angular module
module.then(m => {
    m.run(() => {
        if (config.ALLOW_DECORATORS_IN_SERVICES) {
            exposeModule(m)
        }
    });
});

/**
 * Calls all registered annotations on the controller, or on
 * a service
 * @param controller
 * @param $scope
 */
export function callAnnotations(controller, $scope)
{
    //Async wrapper
    let asyncWrapper = function (result) {
        if (result instanceof Promise) {
            result.then(() => $scope.$digest.call($scope));
        }
    };

    //Call init methods
    let inited = [];
    for (let initializer of controller[symbols.init] || [])
    {
        if (!inited.includes(initializer)) {
            asyncWrapper(controller[initializer]());
        }
        inited.push(initializer);
    }

    //Bind watches
    let watched = [];
    let $parse = angularInjector().get("$parse");
    for (let watcher of controller[symbols.watch] || []) {
        if (!watched.includes(watcher)) {

            //Parse the angular expression
            let parse = $parse(watcher.property);
            let getter = () => parse(controller);

            let action = function(...params){
                controller[watcher.name](...params);
            }.bind(controller);

            if (!watcher.collection) $scope.$watch(getter, action, !!watcher.deep);
            else $scope.$watchCollection(getter, action);
        }
        watched.push(watcher);
    }


    //Bind events
    let evented = [];
    for (let on of controller[symbols.on] || []) {
        if (! evented.includes(on)) {
            $scope.$on(on.event, function(...params){
                asyncWrapper(controller[on.name](...params));
            }).bind(controller);
        }
        evented.push(on);
    }

    //Scheduled methods
    let $interval = angularInjector().get("$interval");
    let scheduled = [];
    for (let schedule of controller[symbols.schedule] || []) {
        if (!scheduled.includes(schedule)){
            let id = $interval(function(){
                asyncWrapper(controller[schedule.name]());
            }.bind(controller), schedule.interval);
            $scope.$on("$destroy", () => $interval.cancel(id));
        }
    }

    //Call destroy methods
    $scope.$on("$destroy", function(){
        let destroyed = [];
        for (let destroyer of controller[symbols.destroy] || [])
        {
            if (!destroyed.includes(destroyer)) controller[destroyer]();
            destroyed.push(destroyer);
        }
    });
}