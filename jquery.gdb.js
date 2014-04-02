$(function(){//Wait for jQuery to be ready
    window.GDB=function(modelsToMonitorObject,userOptionsObject){//GDB Object constructor

        //HELPERS
        this.helpers={
            isEventSupported: function(eventName) {
                var tags = {
                    'select':'input','change':'input',
                    'submit':'form','reset':'form',
                    'error':'img','load':'img','abort':'img'
                };
                var el = document.createElement(tags[eventName] || 'div');
                eventName = 'on' + eventName;
                var isSupported = (eventName in el);
                if (!isSupported) {
                    el.setAttribute(eventName, 'return;');
                    isSupported = typeof el[eventName] == 'function';
                }
                el = null;
                return isSupported;
            }
        };

        //INITIALIZATION CODE
        var GDB=this;

        var options={
            rootElementSelectorString: 'body',
            templateOpeningDelimiter: '<<',
            templateClosingDelimiter: '>>',
            realtime: true,
            dataBindToAttr: 'data-bindto',
            dataBindToTemplateAttr: 'data-bindto-template',
            dataParseWithAttr: 'data-parse-with',
            bindAsTextOnly: false,
            insertPolyfills: true,
            parsingFunctionsObject: {},
            debugLogging: false,
            modelChangeCallback: null
        };

        if(userOptionsObject !== undefined)//If there are user options supplied...
            options= $.extend(options, userOptionsObject);// merge them into the default options.

        //ADD POLYFILLS WHERE APPLICABLE
        if(options.insertPolyfills===true)
            loadPolyFills();

        var modelsToMonitor=modelsToMonitorObject;

        //EVENT LISTENERS
        var listenForEvents=(options.realtime ? (GDB.helpers.isEventSupported('input') ? 'input' : 'keyup')+' paste ' : '')+' change blur';//listen for events based on whether we're updating in realtime or just as changes are committed.

        //LISTEN FOR CHANGES TO ELEMENTS IN THE VIEW
        $(options.rootElementSelectorString).on(listenForEvents,'['+options.dataBindToAttr+'],['+options.dataBindToTemplateAttr+']', function(e){
            var $this=$(this);
            var value="";

            if($this.is('['+options.dataBindToAttr+']')){//If this element is bound to a location on the data model

                var modelLocation=$this.attr(options.dataBindToAttr);//get the location in the in the model the element is bound to

                //Determine what kind of element this is
                if($this.is('input,select,textarea')){//if this is a form element
                    //var value=$this.val(); //get the value
                    if($this.is(':checkbox'))//if this form element is a checkbox
                    {
                        //Find all field bound to this location in the model that are checked check boxes
                        value=$("["+options.dataBindToAttr+"='"+$this.attr(options.dataBindToAttr)+"'][name='"+$this.attr('name')+"']:checked").map(function(){
                            return $(this).val();
                        }).toArray();//and create an array from these values
                    }
                    else{//Otherwise...
                            value=$this.val();//get the value of the bound element
                    }
                }
                else //Otherwise...
                    value=options.bindAsTextOnly ? $this.text() : $this.html();//get the text or html of the element depending on the options set.

                if(!$.isArray(value))//If the value is not an array
                    value="'"+value.replace("'", "\\'").replace(/\n/g, '\\n')+"'";//escape new line and single quotes
                else
                    value=JSON.stringify(value);

                eval("modelsToMonitor."+modelLocation+"="+value);//evaluate the path in the model to which the data is bound.

                if(options.debugLogging)
                    console.log(modelLocation+" is now equal to "+value+" as per changes made in the view as witnessed by the \""+e.type+"\" event.");

            }
        });

        //LOOP THROUGH ALL SUPPLIED MODELS AND RECURSIVELY OBSERVE OBJECTS WITHIN OBJECTS
        var observeObjects=function(objectToObserve,objectLocationString,previousObjects){

            previousObjects = previousObjects || [];//array of previously observed objects. We keep this to prevent redundant observation in circular structures

            $.each(objectToObserve,function(key,value) {


               if((value !== null && //check if value is not null
                (typeof value === 'object' || //and it is an object
                value instanceof Array)) && //or an array
                function(){ //finally check that this object is not reference to a previously observed object
                     var wasNotSeen=true;
                     previousObjects.forEach(function(object){
                         if(object===value)
                            wasNotSeen=false;
                     });
                     return wasNotSeen;
                }()){

                    previousObjects.push(value);//add this object to the array of previously seen objects.

                    var thisLocation="";//variable for storing the current location

                    if(typeof objectLocationString === "undefined")//If there is no object location string, create a new one.
                        thisLocation=""+key;
                    else{ //Otherwise...
                        if(!isNaN(key))//if the key is an array index
                            thisLocation=objectLocationString+"["+key+"]";
                        else //or if the key is an object property
                            thisLocation=objectLocationString+"."+key;
                    }

                   console.log(thisLocation);
                   console.log(value);

                    //OBSERVE CHANGES IN MODEL'S DATASTRUCTURE TO REFLECT
                    Object.observe(value,function(changes){
                        changes.forEach(function(change){//For every change in the object...

                            var key=!isNaN(change.name) ? '['+change.name+']' : '.'+change.name; //set key based on whether the key is an array index or object property.
                            var elementSelector="["+options.dataBindToAttr+"='"+thisLocation+key+"']";
                            var newValue=change.object[change.name];

                            $(elementSelector).each(function(){//loop through each item

                                if($(this).is('input,select,textarea')){ //If element is a form element
                                        if($(this).is(':checkbox'))//if this form element is checkbox
                                        {
                                            $(elementSelector).each(function(){//For each of these checkbox elements
                                                var $this=$(this);
                                                var isValue=false;//variable for checking whether or not this element is among checked values
                                                newValue.forEach(function(newValue){//compare the value of this element against each value in the array of values
                                                    if($this.val()==newValue){//if the value of this element is equal to a value in the array
                                                        if(!$this.is(':checked'))//and the element is not already checked
                                                            $this.attr('checked','checked');//check the element
                                                        isValue=true;//if this element is equal to a value in the array, set this variable to true
                                                    }
                                                });
                                                if(!isValue)//if it has been determined that this element is equal to no value in the array,
                                                    $this.removeAttr('checked');//remove any potential check marks.
                                            });
                                        }
                                        else if($(this).is(':radio')){//else, if this is a radio box
                                            $(elementSelector).each(function(){//For each of these radio elements
                                                var $this=$(this);
                                                if($this.val()==newValue)//if the value of this element is equal to the changed value
                                                    $this.attr('checked','checked');//check the radio box in question
                                                else{//Otherwise, if this is not equal to the new value, remove the checked attribute
                                                    $this.removeAttr('checked');//remove any potential check marks.
                                                }
                                            });

                                        }
                                        else{//Otherwise...
                                            if($(elementSelector).val()!=newValue)
                                                $(elementSelector).val(newValue);//set the value of the bound element
                                        }

                                }
                                else{
                                    if(!options.bindAsTextOnly){//if we're not binding as text only
                                        if($(elementSelector).html()!=newValue)
                                            $(elementSelector).html(newValue);//set the html of the bound element
                                    }
                                    else{ //Otherwise...
                                        if($(elementSelector).text()!=newValue)
                                            $(elementSelector).text(newValue);//set the text of the bound element
                                    }
                                }

                            });

                            if($.isArray(newValue))//If the new value is an array
                                var logValue=JSON.stringify(newValue);//set the logging value as a stringified array
                            else//Otherwise...
                                var logValue="'"+newValue+"'";//display as a quoted string.

                            if(options.debugLogging)
                                console.log(thisLocation+key+" is now equal to "+logValue+" as observed in the model.");

                            if(typeof options.modelChangeCallback === "function"){//If there is a callback function specified by the user
                                if(options.debugLogging)
                                    console.log("Model change callback executed for change in "+thisLocation+key);
                                options.modelChangeCallback();//run it now.
                            }
                            else{
                                if(options.debugLogging)
                                    console.log("No callback supplied for model change thus no function was called");
                            }

                        });

                    });

                    observeObjects(value,thisLocation,previousObjects);

                }
            });
        };

        //OBSERVE THE MODELS
        observeObjects(modelsToMonitor);

    };








    var loadPolyFills=function(){
        ////////////////////////////////////////////////OBJECT OBSERVE POLYFILL
        /*
         Tested against Chromium build with Object.observe and acts EXACTLY the same,
         though Chromium build is MUCH faster

         Trying to stay as close to the spec as possible,
         this is a work in progress, feel free to comment/update

         Specification:
         http://wiki.ecmascript.org/doku.php?id=harmony:observe

         Built using parts of:
         https://github.com/tvcutsem/harmony-reflect/blob/master/examples/observer.js

         Limits so far;
         Built using polling... Will update again with polling/getter&setters to make things better at some point

         TODO:
         Add support for Object.prototype.watch -> https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/watch
         */
        if(!Object.observe){
            (function(extend, global){
                var isCallable = (function(toString){
                    var s = toString.call(toString),
                        u = typeof u;
                    return typeof global.alert === "object" ?
                        function(f){
                            return s === toString.call(f) || (!!f && typeof f.toString == u && typeof f.valueOf == u && /^\s*\bfunction\b/.test("" + f));
                        }:
                        function(f){
                            return s === toString.call(f);
                        }
                        ;
                })(extend.prototype.toString);
                // isNode & isElement from http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
                //Returns true if it is a DOM node
                function isNode(o){
                    return (
                        typeof Node === "object" ? o instanceof Node :
                            o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
                        );
                }
                //Returns true if it is a DOM element
                function isElement(o){
                    return (
                        typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
                            o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
                        );
                }
                var _isImmediateSupported = (function(){
                    return !!global.setImmediate;
                })();
                var _doCheckCallback = (function(){
                    if(_isImmediateSupported){
                        return function(f){
                            return setImmediate(f);
                        };
                    }else{
                        return function(f){
                            return setTimeout(f, 10);
                        };
                    }
                })();
                var _clearCheckCallback = (function(){
                    if(_isImmediateSupported){
                        return function(id){
                            clearImmediate(id);
                        };
                    }else{
                        return function(id){
                            clearTimeout(id);
                        };
                    }
                })();
                var isNumeric=function(n){
                    return !isNaN(parseFloat(n)) && isFinite(n);
                };
                var sameValue = function(x, y){
                    if(x===y){
                        return x !== 0 || 1 / x === 1 / y;
                    }
                    return x !== x && y !== y;
                };
                var isAccessorDescriptor = function(desc){
                    if (typeof(desc) === 'undefined'){
                        return false;
                    }
                    return ('get' in desc || 'set' in desc);
                };
                var isDataDescriptor = function(desc){
                    if (typeof(desc) === 'undefined'){
                        return false;
                    }
                    return ('value' in desc || 'writable' in desc);
                };

                var validateArguments = function(O, callback){
                    if(typeof(O)!=='object'){
                        // Throw Error
                        throw new TypeError("Object.observeObject called on non-object");
                    }
                    if(isCallable(callback)===false){
                        // Throw Error
                        throw new TypeError("Object.observeObject: Expecting function");
                    }
                    if(Object.isFrozen(callback)===true){
                        // Throw Error
                        throw new TypeError("Object.observeObject: Expecting unfrozen function");
                    }
                };

                var Observer = (function(){
                    var wraped = [];
                    var Observer = function(O, callback){
                        validateArguments(O, callback);
                        Object.getNotifier(O).addListener(callback);
                        if(wraped.indexOf(O)===-1){
                            wraped.push(O);
                        }else{
                            Object.getNotifier(O)._checkPropertyListing();
                        }
                    };

                    Observer.prototype.deliverChangeRecords = function(O){
                        Object.getNotifier(O).deliverChangeRecords();
                    };

                    wraped.lastScanned = 0;
                    var f = (function(wrapped){
                        return function(){
                            var i = 0, l = wrapped.length, startTime = new Date(), takingTooLong=false;
                            for(i=wrapped.lastScanned; (i<l)&&(!takingTooLong); i++){
                                Object.getNotifier(wrapped[i])._checkPropertyListing();
                                takingTooLong=((new Date())-startTime)>100; // make sure we don't take more than 100 milliseconds to scan all objects
                            }
                            wrapped.lastScanned=i<l?i:0; // reset wrapped so we can make sure that we pick things back up
                            _doCheckCallback(f);
                        };
                    })(wraped);
                    _doCheckCallback(f);
                    return Observer;
                })();

                var Notifier = function(watching){
                    var _listeners = [], _updates = [], _updater = false, properties = [], values = [];
                    var self = this;
                    Object.defineProperty(self, '_watching', {
                        enumerable: true,
                        get: (function(watched){
                            return function(){
                                return watched;
                            };
                        })(watching)
                    });
                    var wrapProperty = function(object, prop){
                        var propType = typeof(object[prop]), descriptor = Object.getOwnPropertyDescriptor(object, prop);
                        if((prop==='getNotifier')||isAccessorDescriptor(descriptor)||(!descriptor.enumerable)){
                            return false;
                        }
                        if((object instanceof Array)&&isNumeric(prop)){
                            var idx = properties.length;
                            properties[idx] = prop;
                            values[idx] = object[prop];
                            return true;
                        }
                        (function(idx, prop){
                            properties[idx] = prop;
                            values[idx] = object[prop];
                            Object.defineProperty(object, prop, {
                                get: function(){
                                    return values[idx];
                                },
                                set: function(value){
                                    if(!sameValue(values[idx], value)){
                                        Object.getNotifier(object).queueUpdate(object, prop, 'updated', values[idx]);
                                        values[idx] = value;
                                    }
                                }
                            });
                        })(properties.length, prop);
                        return true;
                    };
                    self._checkPropertyListing = function(dontQueueUpdates){
                        var object = self._watching, keys = Object.keys(object), i=0, l=keys.length;
                        var newKeys = [], oldKeys = properties.slice(0), updates = [];
                        var prop, queueUpdates = !dontQueueUpdates, propType, value, idx, aLength;

                        if(object instanceof Array){
                            aLength = properties.length;
                        }

                        for(i=0; i<l; i++){
                            prop = keys[i];
                            value = object[prop];
                            propType = typeof(value);
                            if((idx = properties.indexOf(prop))===-1){
                                if(wrapProperty(object, prop)&&queueUpdates){
                                    self.queueUpdate(object, prop, 'new', null, object[prop]);
                                }
                            }else{
                                if((object instanceof Array)&&(isNumeric(prop))){
                                    if(values[idx] !== value){
                                        if(queueUpdates){
                                            self.queueUpdate(object, prop, 'updated', values[idx], value);
                                        }
                                        values[idx] = value;
                                    }
                                }
                                oldKeys.splice(oldKeys.indexOf(prop), 1);
                            }
                        }

                        if(object instanceof Array && object.length !== aLength){
                            if(queueUpdates){
                                self.queueUpdate(object, 'length', 'updated', aLength, object);
                            }
                        }

                        if(queueUpdates){
                            l = oldKeys.length;
                            for(i=0; i<l; i++){
                                idx = properties.indexOf(oldKeys[i]);
                                self.queueUpdate(object, oldKeys[i], 'deleted', values[idx]);
                                properties.splice(idx,1);
                                values.splice(idx,1);
                            };
                        }
                    };
                    self.addListener = function(callback){
                        var idx = _listeners.indexOf(callback);
                        if(idx===-1){
                            _listeners.push(callback);
                        }
                    };
                    self.removeListener = function(callback){
                        var idx = _listeners.indexOf(callback);
                        if(idx>-1){
                            _listeners.splice(idx, 1);
                        }
                    };
                    self.listeners = function(){
                        return _listeners;
                    };
                    self.queueUpdate = function(what, prop, type, was){
                        this.queueUpdates([{
                            type: type,
                            object: what,
                            name: prop,
                            oldValue: was
                        }]);
                    };
                    self.queueUpdates = function(updates){
                        var self = this, i = 0, l = updates.length||0, update;
                        for(i=0; i<l; i++){
                            update = updates[i];
                            _updates.push(update);
                        }
                        if(_updater){
                            _clearCheckCallback(_updater);
                        }
                        _updater = _doCheckCallback(function(){
                            _updater = false;
                            self.deliverChangeRecords();
                        });
                    };
                    self.deliverChangeRecords = function(){
                        var i = 0, l = _listeners.length,
                        //keepRunning = true, removed as it seems the actual implementation doesn't do this
                        // In response to BUG #5
                            retval;
                        for(i=0; i<l; i++){
                            if(_listeners[i]){
                                if(_listeners[i]===console.log){
                                    console.log(_updates);
                                }else{
                                    _listeners[i](_updates);
                                }
                            }
                        }
                        /*
                         for(i=0; i<l&&keepRunning; i++){
                         if(typeof(_listeners[i])==='function'){
                         if(_listeners[i]===console.log){
                         console.log(_updates);
                         }else{
                         retval = _listeners[i](_updates);
                         if(typeof(retval) === 'boolean'){
                         keepRunning = retval;
                         }
                         }
                         }
                         }
                         */
                        _updates=[];
                    };
                    self._checkPropertyListing(true);
                };

                var _notifiers=[], _indexes=[];
                extend.getNotifier = function(O){
                    var idx = _indexes.indexOf(O), notifier = idx>-1?_notifiers[idx]:false;
                    if(!notifier){
                        idx = _indexes.length;
                        _indexes[idx] = O;
                        notifier = _notifiers[idx] = new Notifier(O);
                    }
                    return notifier;
                };
                extend.observe = function(O, callback){
                    // For Bug 4, can't observe DOM elements tested against canry implementation and matches
                    if(!isElement(O)){
                        return new Observer(O, callback);
                    }
                };
                extend.unobserve = function(O, callback){
                    validateArguments(O, callback);
                    var idx = _indexes.indexOf(O),
                        notifier = idx>-1?_notifiers[idx]:false;
                    if (!notifier){
                        return;
                    }
                    notifier.removeListener(callback);
                    if (notifier.listeners().length === 0){
                        _indexes.splice(idx, 1);
                        _notifiers.splice(idx, 1);
                    }
                };
            })(Object, this);
        }

        /////////////////////////////////FOREACH POLYFILL
        if (!Array.prototype.forEach)
        {
            Array.prototype.forEach = function(fun /*, thisArg */)
            {
                "use strict";

                if (this === void 0 || this === null)
                    throw new TypeError();

                var t = Object(this);
                var len = t.length >>> 0;
                if (typeof fun !== "function")
                    throw new TypeError();

                var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
                for (var i = 0; i < len; i++)
                {
                    if (i in t)
                        fun.call(thisArg, t[i], i, t);
                }
            };
        }

    };

});