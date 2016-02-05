(function(){//Anonymous function for namespacing
    var gdbFactory=function(jQuery)
    {
        var $ = jQuery || window.jQuery;
        var instanceID=0;
        var GDB = function (modelsToMonitorObject, userOptionsObject) {//GDB Object constructor


            //INITIALIZATION CODE
            var GDB = this || {};
            GDB.id=instanceID;
            instanceID++;
            var listenForEvents;//Definition for variable which hold the list of events to listen for, for event binding
            var observeObjects;//Definition for function which is used to observe or unobserve object behavior
            var witnessedObjects={};//Object for storing location keys for every witnessed array or object
            GDB.witnessedObjects=witnessedObjects;
            //HELPERS
            GDB.helpers = {
                isEventSupported: function (eventName) {
                    var tags = {
                        'select': 'input', 'change': 'input',
                        'submit': 'form', 'reset': 'form',
                        'error': 'img', 'load': 'img', 'abort': 'img'
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
                },
                escapeForRegEx: function(str) {
                    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
                },
                isElement: function (o){
                    return (typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
                            o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string");
                }
            };

            var options = {
                rootElementSelectorString: null,//Deprecated for rootElement
                rootElement: 'body',
                templateOpeningDelimiter: '<<',
                templateClosingDelimiter: '>>',
                realtime: true,
                renderOnInitialization: true,
                dataBindToAttr: 'data-bindto',
                dataWatchingAttr: 'data-watching',
                dataTemplateAttr: 'data-gdb-template',
                dataParseWithAttr: 'data-parsewith',
                dataBindOnAttrPrefix: 'data-bindon-',
                listenForEvents:'click dblclick change input keydown mouseover mouseout keypress keyup mousedown mouseup focus blur',
                bindAsTextOnly: false,
                insertPolyfills: true,
                debugLogging: false,
                modelChangeCallback: null,
                elementChangeCallback: null
            };

            if (userOptionsObject !== undefined)//If there are user options supplied...
                options = $.extend(options, userOptionsObject);// merge them into the default options.

            //ADD POLYFILLS WHERE APPLICABLE
            if (options.insertPolyfills === true)
                loadPolyFills();

            if (options.rootElementSelectorString === null) {
                (function(){
                    var el_get = function( el ){
                        if ( typeof el === "string" )
                            el = ( document ).querySelector( el );
                        else
                        if ( isjQuery_el( el ) )
                            el = el.get(0);
                        return el;
                    };

                    // Returns true if $el is a jQuery element.
                    var isjQuery_el = function( $el ){
                        return $el instanceof jQuery;
                    };

                    options.rootElementSelectorString = el_get(options.rootElement);

                }());
            }

            var modelsToMonitor = modelsToMonitorObject;//Models to watch

            //PUBLIC INSTANCE METHODS
            GDB.getBoundElementFromModelPath = function (path) { //Function for getting bound elements as jquery collection given a model path
                //TODO: Enhance this so that it can also handle event bindings and not just data bindings
                return $('[' + options.dataBindToAttr + '="' + path + '"]');
            };

            GDB.getModelPathFromBoundElement = function (selector) {//Function for getting a model path for a bound element given an DOM node or selector string
                var $element = $(selector);
                if ($element.is('[' + options.dataBindToAttr + ']'))//if this element has a bound model path
                    return $element.attr(options.dataBindToAttr);//then return the model path
                else
                    return false;//else return false
            };

            GDB.getValueFromModelPath = function (path) {//Function for returning a property in a watched model's value given a model path
                var modelValue = $.extend(true, {}, modelsToMonitor);// a copy of the orginal watched models
                if(typeof path==="undefined")//if path is not a value
                    return;
                path = path.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
                path = path.replace(/^\./, '');           // strip a leading dot
                var array = path.split('.');
                while (array.length) {
                    var item = array.shift();
                    if (item in modelValue) {
                        modelValue = modelValue[item];
                    } else {
                        return;
                    }
                }
                return modelValue;
            };

            GDB.getModelPathFromModelPart=function(modelPartObject){//Function for returning a model path location given an object or array in the model, that is: a part of the model
                var modelPath=null;
                $.each(witnessedObjects, function(modelPathLocation, value){
                    if(value===modelPartObject){
                        modelPath=modelPathLocation;
                        return false;
                    }
                });
                return modelPath;
            };

            GDB.getBoundElementsForModelPart=function(modelPartObject){
                //TODO: Enhance this so that it can also handle event bindings and not just data bindings
                var path=GDB.getModelPathFromModelPart(modelPartObject);
                return $('[' + options.dataBindToAttr + '^="' + path + '"]').filter(function(){
                    var attrValue=$(this).attr(options.dataBindToAttr);
                    var parent=attrValue.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
                    var parentLocationArr=parent.split('.');
                    parentLocationArr.pop();
                    parent=parentLocationArr.join(".");
                    if(parent==path)
                        return true;
                });
            };

            GDB.render = function(){//Set bound elements to their bound data on call.
                var $selector=$(options.rootElementSelectorString).find("[" + options.dataBindToAttr + "],[" + options.dataWatchingAttr+"]");
                $selector.each(function(){
                    setElementsToValue($(this),GDB.getValueFromModelPath($(this).attr(options.dataBindToAttr)));
                });
            };

            GDB.destroyInstance = function(){//Function for destroying a GDB instance by removing event listeners and unobserving models assocaited with this instance.
                $(options.rootElementSelectorString).off(setEventsToNamespaced(listenForEvents+" "+options.listenForEvents));
                observeObjects(true, modelsToMonitor);
            };

            //PRIVATE METHODS
            var setEventsToNamespaced=function(eventsString){
                var splitEvents=eventsString.split(" ");
                splitEvents.forEach(function(item,i){
                    splitEvents[i]=item+".gdbInstance"+GDB.id;
                });
                return splitEvents.join(" ");
            };

            var setElementsToValue=function($element,value){
                $element.each(function () {//loop through each item

                    if ($(this).is("[" + options.dataWatchingAttr + "][" + options.dataParseWithAttr + "]")) //If this element is watching locations in the model and has a data parsing function
                        var newValue = eval("modelsToMonitor." + $(this).attr(options.dataParseWithAttr) + ".in()");

                    else if ($(this).is("[" + options.dataWatchingAttr + "][" + options.dataTemplateAttr + "]")) {//If this element is watching locations in the model and has a gdb template
                        var modelLocations=$(this).attr(options.dataWatchingAttr).split(",");
                        var template=$(this).attr(options.dataTemplateAttr);
                        modelLocations.forEach(function(location,index){
                            template=template.replace(new RegExp(GDB.helpers.escapeForRegEx(options.templateOpeningDelimiter)+(index+1)+GDB.helpers.escapeForRegEx(options.templateClosingDelimiter),"g"),GDB.getValueFromModelPath(location.trim()));
                        });
                        newValue = template;
                    }
                    else //Otherwise, make sure the new value is set back to the correct value
                        newValue = value;//change.object[change.name];

                    if ($(this).is('input,select,textarea')) { //If element is a form element
                        if ($(this).is(':checkbox'))//if this form element is checkbox
                        {
                            $element.each(function () {//For each of these checkbox elements
                                var $this = $(this);
                                var isValue = false;//variable for checking whether or not this element is among checked values
                                newValue.forEach(function (newValue) {//compare the value of this element against each value in the array of values
                                    if ($this.val() == newValue) {//if the value of this element is equal to a value in the array
                                        if (!$this.is(':checked'))//and the element is not already checked
                                            $this.prop('checked', true);//check the element
                                        isValue = true;//if this element is equal to a value in the array, set this variable to true
                                    }
                                });
                                if (!isValue)//if it has been determined that this element is equal to no value in the array,
                                    $this.prop('checked', false);//remove any potential check marks.
                            });
                        }
                        else if ($(this).is(':radio')) {//else, if this is a radio box
                            $element.each(function () {//For each of these radio elements
                                var $this = $(this);
                                if ($this.attr('value') == newValue)//if the value of this element is equal to the changed value
                                    $this.prop('checked', true);//check the radio box in question
                                else//Otherwise, if this is not equal to the new value, remove the checked attribute
                                    $this.prop('checked', false);//remove any potential check marks.
                            });

                        }
                        else {//Otherwise...
                            if (!$(this).is("[" + options.dataWatchingAttr + "][" + options.dataTemplateAttr + "]:focus")){//Do not update the value if this a template based field with focus
                                if ($(this).val() != newValue)
                                    $(this).val(newValue);//set the value of the bound element
                            }
                        }

                    }
                    else {
                        if (!options.bindAsTextOnly) {//if we're not binding as text only
                            if (!$(this).is("[" + options.dataWatchingAttr + "][" + options.dataTemplateAttr + "]:focus")) {//Do not update the value if this a template based field with focus
                                if ($(this).html() != newValue)
                                    $(this).html(newValue);//set the html of the bound element
                            }
                        }
                        else { //Otherwise...
                            if (!$(this).is("[" + options.dataWatchingAttr + "][" + options.dataTemplateAttr + "]:focus")) {//Do not update the value if this a template based field with focus
                                if ($(this).text() != newValue)
                                    $(this).text(newValue);//set the text of the bound element
                            }
                        }
                    }

                });
            };

            //FURTHER INITIALIZATION
            if(options.renderOnInitialization)
                GDB.render();

            //EVENT LISTENERS
            listenForEvents = (options.realtime ? (GDB.helpers.isEventSupported('input') ? 'input' : 'keyup') + ' paste ' : '') + ' change blur';//listen for events based on whether we're updating in realtime or just as changes are committed.

            //LISTEN FOR CHANGES TO ELEMENTS IN THE VIEW
            $(options.rootElementSelectorString).on(setEventsToNamespaced(listenForEvents), '[' + options.dataBindToAttr + '],[' + options.dataTemplateAttr + '],['+options.dataParseWithAttr+']', function (e) {
                var $this = $(this);
                var value = "";
                if ($this.is('[' + options.dataBindToAttr + '],['+options.dataParseWithAttr+'],['+options.dataTemplateAttr+']')) {//If this element is bound to a location on the data model or has a parsing function

                    var modelLocation = $this.attr(options.dataBindToAttr);//get the location in the in the model the element is bound to

                    //Determine what kind of element this is
                    if ($this.is('input,select,textarea')) {//if this is a form element
                        //var value=$this.val(); //get the value
                        if ($this.is(':checkbox'))//if this form element is a checkbox
                        {
                            //Find all field bound to this location in the model that are checked check boxes
                            value = $("[" + options.dataBindToAttr + "='" + $this.attr(options.dataBindToAttr) + "'][name='" + $this.attr('name') + "']:checked").map(function () {
                                return $(this).val();
                            }).toArray();//and create an array from these values
                        }
                        else {//Otherwise...
                            value = $this.val();//get the value of the bound element
                        }
                    }
                    else //Otherwise...
                        value = options.bindAsTextOnly ? $this.text() : $this.html();//get the text or html of the element depending on the options set.

                    var rawValue=value;//the value before sanitizing it.

                    if (!$.isArray(value))//If the value is not an array
                        value = "'" + value.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";//escape backslash, new line and single quotes
                    else
                        value = JSON.stringify(value);

                    if(modelLocation)
                        eval("modelsToMonitor." + modelLocation + "=" + value);//evaluate the path in the model to which the data is bound.

                    if($this.is("["+options.dataParseWithAttr+"]"))//If this has a data parsing function
                        eval("modelsToMonitor."+$this.attr(options.dataParseWithAttr)+".out("+value+")");

                    if ($this.is("[" + options.dataWatchingAttr + "][" + options.dataTemplateAttr + "]")) {//If this element is watching locations in the model and has a gdb template
                        var splitBys=$(this).attr(options.dataTemplateAttr).split(new RegExp(GDB.helpers.escapeForRegEx(options.templateOpeningDelimiter)+"\\d+"+GDB.helpers.escapeForRegEx(options.templateClosingDelimiter),"g"));//Create an array of indexes which will be used in a regular expression to decipher where template information is stored
                        var toDelete=[];
                        splitBys.forEach(function(item,i){//loop through split bys
                            if(item.length===0)
                                toDelete.push(i);
                            else
                                splitBys[i]=GDB.helpers.escapeForRegEx(item);//escape value for regex usage.
                        });
                        var subtract=0;
                        toDelete.forEach(function(index){
                            splitBys.splice(parseInt(index)-subtract, 1);
                            subtract++;
                        });

                        var modelLocationValuesArray=[];//An array for mapping data in the template to locations in the model
                        var valueArray=rawValue.split(new RegExp(splitBys.join("|"), "g"));
                        var indexArray=$(this).attr(options.dataTemplateAttr).split(new RegExp(splitBys.join("|"), "g"));
                        var modelLocations=$(this).attr(options.dataWatchingAttr).split(",");

                        indexArray.forEach(function(value,i){
                            var index=(parseInt(value.replace(new RegExp(GDB.helpers.escapeForRegEx(options.templateOpeningDelimiter)+"|"+GDB.helpers.escapeForRegEx(options.templateClosingDelimiter),"g"), ""))-1);
                            modelLocationValuesArray.push({
                                location: modelLocations[index].trim(),
                                value: typeof valueArray[i] === "undefined" ? '""' : JSON.stringify(valueArray[i])
                            });
                        });
                        modelLocationValuesArray.forEach(function(modelLocationAndValue){
                            console.log("modelsToMonitor." + modelLocationAndValue.location + "=" + modelLocationAndValue.value);
                            eval("modelsToMonitor." + modelLocationAndValue.location + "=" + modelLocationAndValue.value);//evaluate the path in the model to which the data is bound.
                        });
                    }

                    if (options.debugLogging)
                        console.log(modelLocation + " is now equal to " + value + " as per changes made in the view as witnessed by the \"" + e.type + "\" event.");

                    if (typeof options.elementChangeCallback === "function") {//If there is a callback function specified by the user
                        if (options.debugLogging)//if debug logging is enabled
                            console.log("Bound element change callback executed for change in " + modelLocation);//show log information
                        options.elementChangeCallback({
                            locationPathString: modelLocation, //the location in the model as a string
                            $boundElement: $this, //the element changed as a jquery object
                            newValue: rawValue//the new value of the element
                        });//run it now.
                    }
                    else {
                        if (options.debugLogging)
                            console.log("No callback supplied for bound element change thus no function was called");
                    }

                }
            });

            //LISTEN FOR EVENTS ON EVENT BOUND ELEMENTS
            var elementsToWatch=(function(){//Set the elements to watch from the result of the follow function
                var listOfAttributes="";//variable for storing a comma separated list of attribute selectors
                options.listenForEvents.split(" ").forEach(function(eventName){//split the list of events to listen for
                     listOfAttributes+="["+options.dataBindOnAttrPrefix+eventName+"],";//assemble our selector string
                });
                return listOfAttributes.substring(0, listOfAttributes.length - 1);//return it, minus the trailing comma
            }());
            //The events listeners for event bound elements
            $(options.rootElementSelectorString).on(setEventsToNamespaced(options.listenForEvents), elementsToWatch, function (e) {
                var functionLocation=$(this).attr(options.dataBindOnAttrPrefix + e.type);//Combine the event data attribute prefix and the fired event's type to get the value from the bound attribute.

                if(functionLocation){
                    //Augment the event object with a property which is equal to the bound data that the model location represents
                    e.gdbBoundData=$(this).attr(options.dataBindToAttr) ? eval("modelsToMonitor."+$(this).attr(options.dataBindToAttr)) : null;
                    //Augment the event object with a property which is an array equal to the objects that the model locations represent
                    e.gdbWatchingData=(function(){
                        if($(this).attr(options.dataWatchingAttr)){
                            var watchingArr=[];
                            $(this).attr(options.dataWatchingAttr).split(",").forEach(function(modelLocation){
                                watchingArr.push(eval("modelsToMonitor."+modelLocation.trim()));
                            });
                            return watchingArr;
                        }
                        else
                            return null;
                    }());
                    //Augment the event object with a property which is the object or array to which this event function belongs.
                    e.gdbParent=(function(){
                        var parent=functionLocation.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
                        var parentLocationArr=parent.split('.');
                        parentLocationArr.pop();
                        parent=parentLocationArr.join(".");
                        return GDB.getValueFromModelPath(parent);
                    }());


                    eval("modelsToMonitor." + functionLocation + ".apply(this, [e]);");//evaluate the path in the model in where the function exists and apply it.
                }

            });

            //LOOP THROUGH ALL SUPPLIED MODELS AND RECURSIVELY OBSERVE OBJECTS WITHIN OBJECTS
            var observerFunctions={};//Object containing properties whose name matches the locations in the watched model and whose values are equal to the observer functions.
            observeObjects = function (unobserve, objectToObserve, objectLocationString, previousObjects) {
                var observationAction = unobserve ? 'unobserve' : 'observe';//Variable used to decide which function is called depending on whether we're observing or unobserving.

                previousObjects = previousObjects || [];//array of previously observed objects. We keep this to prevent redundant observation in circular structures

                $.each(objectToObserve, function (key, value) {


                    if ((value !== null && //check if value is not null
                        (typeof value === 'object' || //and it is an object
                        value instanceof Array)) && //or an array
                        !GDB.helpers.isElement(value) && //and also not a DOM element
                        function () { //finally check that this object is not reference to a previously observed object
                            var wasNotSeen = true;
                            previousObjects.forEach(function (object) {
                                if (object === value)
                                    wasNotSeen = false;
                            });
                            return wasNotSeen;
                        }()) {

                        previousObjects.push(value);//add this object to the array of previously seen objects.

                        var thisLocation = "";//variable for storing the current location

                        if (typeof objectLocationString === "undefined")//If there is no object location string, create a new one.
                            thisLocation = "" + key;
                        else { //Otherwise...
                            if (!isNaN(key))//if the key is an array index
                                thisLocation = objectLocationString + "[" + key + "]";
                            else //or if the key is an object property
                                thisLocation = objectLocationString + "." + key;
                        }

                        witnessedObjects[thisLocation]=value;//Add this object or array to the witnessedObjects object which contains a mapping of locations to object or arrays

                        //OBSERVE CHANGES IN MODEL'S DATASTRUCTURE TO REFLECT
                        var changeHandlerFunction= observerFunctions[thisLocation+key] ? observerFunctions[thisLocation+key] : function (changes) {
                            changes.forEach(function (change) {//For every change in the object...

                                var key = !isNaN(change.name) ? '[' + change.name + ']' : '.' + change.name; //set key based on whether the key is an array index or object property.
                                var modelPath=thisLocation+key;
                                var elementSelector = "[" + options.dataBindToAttr + "='" + modelPath + "'],[" + options.dataWatchingAttr+"*='" + modelPath + ",'],[" + options.dataWatchingAttr+"$='" + modelPath + "']";
                                var newValue = change.object[change.name];
                                var oldValue = change.oldValue;
                                var $element=$(elementSelector);

                                if (typeof newValue === 'object' || //If the new value is an object
                                    newValue instanceof Array) { //or an array
                                    observeObjects(unobserve, value, thisLocation, previousObjects);//Observe this object or array and all of its obserable children.
                                }

                                setElementsToValue($element,newValue);

                                if ($.isArray(newValue))//If the new value is an array
                                    var logValue = JSON.stringify(newValue);//set the logging value as a stringified array
                                else//Otherwise...
                                    logValue = "'" + newValue + "'";//display as a quoted string.

                                if (options.debugLogging)
                                    console.log(thisLocation + key + " is now equal to " + logValue + " as observed in the model.");

                                if (typeof options.modelChangeCallback === "function") {//If there is a callback function specified by the user
                                    if (options.debugLogging)//if debug logging is enabled
                                        console.log("Model change callback executed for change in " + thisLocation + key);//show log information
                                    options.modelChangeCallback({
                                        locationPathString: modelPath, //the location in the model as a string
                                        $boundElements: $element, //the bound elements as a jquery collection
                                        newValue: newValue, //the new value of the property
                                        oldValue: oldValue //the old value of the property
                                    });//run it now.
                                }
                                else {
                                    if (options.debugLogging)
                                        console.log("No callback supplied for model change thus no function was called");
                                }

                            });

                        };
                        if(!observerFunctions[thisLocation+key])//if the function for this location is not stored...
                            observerFunctions[thisLocation+key]=changeHandlerFunction;//...store it
                        Object[observationAction](value,changeHandlerFunction);//use this function for handling model changes

                        observeObjects(unobserve, value, thisLocation, previousObjects);//recursively observe this object or array.

                    }
                });
            };

            //OBSERVE THE MODELS
            observeObjects(false, modelsToMonitor);

        };


        var loadPolyFills = function () {
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
             */
            if (!Object.observe) {
                (function (extend, global) {
                    var isCallable = (function (toString) {
                        var s = toString.call(toString),
                            u = typeof u;
                        return typeof global.alert === "object" ?
                            function (f) {
                                return s === toString.call(f) || (!!f && typeof f.toString == u && typeof f.valueOf == u && /^\s*\bfunction\b/.test("" + f));
                            } :
                            function (f) {
                                return s === toString.call(f);
                            }
                            ;
                    })(extend.prototype.toString);
                    // isNode & isElement from http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
                    //Returns true if it is a DOM node
                    function isNode(o) {
                        return (
                            typeof Node === "object" ? o instanceof Node :
                            o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string"
                        );
                    }

                    //Returns true if it is a DOM element
                    function isElement(o) {
                        return (
                            typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
                            o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName === "string"
                        );
                    }

                    var _isImmediateSupported = (function () {
                        return !!global.setImmediate;
                    })();
                    var _doCheckCallback = (function () {
                        if (_isImmediateSupported) {
                            return function (f) {
                                return setImmediate(f);
                            };
                        } else {
                            return function (f) {
                                return setTimeout(f, 10);
                            };
                        }
                    })();
                    var _clearCheckCallback = (function () {
                        if (_isImmediateSupported) {
                            return function (id) {
                                clearImmediate(id);
                            };
                        } else {
                            return function (id) {
                                clearTimeout(id);
                            };
                        }
                    })();
                    var isNumeric = function (n) {
                        return !isNaN(parseFloat(n)) && isFinite(n);
                    };
                    var sameValue = function (x, y) {
                        if (x === y) {
                            return x !== 0 || 1 / x === 1 / y;
                        }
                        return x !== x && y !== y;
                    };
                    var isAccessorDescriptor = function (desc) {
                        if (typeof(desc) === 'undefined') {
                            return false;
                        }
                        return ('get' in desc || 'set' in desc);
                    };
                    var isDataDescriptor = function (desc) {
                        if (typeof(desc) === 'undefined') {
                            return false;
                        }
                        return ('value' in desc || 'writable' in desc);
                    };

                    var validateArguments = function (O, callback) {
                        if (typeof(O) !== 'object') {
                            // Throw Error
                            throw new TypeError("Object.observeObject called on non-object");
                        }
                        if (isCallable(callback) === false) {
                            // Throw Error
                            throw new TypeError("Object.observeObject: Expecting function");
                        }
                        if (Object.isFrozen(callback) === true) {
                            // Throw Error
                            throw new TypeError("Object.observeObject: Expecting unfrozen function");
                        }
                    };

                    var Observer = (function () {
                        var wraped = [];
                        var Observer = function (O, callback) {
                            validateArguments(O, callback);
                            Object.getNotifier(O).addListener(callback);
                            if (wraped.indexOf(O) === -1) {
                                wraped.push(O);
                            } else {
                                Object.getNotifier(O)._checkPropertyListing();
                            }
                        };

                        Observer.prototype.deliverChangeRecords = function (O) {
                            Object.getNotifier(O).deliverChangeRecords();
                        };

                        wraped.lastScanned = 0;
                        var f = (function (wrapped) {
                            return function () {
                                var i = 0, l = wrapped.length, startTime = new Date(), takingTooLong = false;
                                for (i = wrapped.lastScanned; (i < l) && (!takingTooLong); i++) {
                                    Object.getNotifier(wrapped[i])._checkPropertyListing();
                                    takingTooLong = ((new Date()) - startTime) > 100; // make sure we don't take more than 100 milliseconds to scan all objects
                                }
                                wrapped.lastScanned = i < l ? i : 0; // reset wrapped so we can make sure that we pick things back up
                                _doCheckCallback(f);
                            };
                        })(wraped);
                        _doCheckCallback(f);
                        return Observer;
                    })();

                    var Notifier = function (watching) {
                        var _listeners = [], _updates = [], _updater = false, properties = [], values = [];
                        var self = this;
                        Object.defineProperty(self, '_watching', {
                            enumerable: true,
                            get: (function (watched) {
                                return function () {
                                    return watched;
                                };
                            })(watching)
                        });
                        var wrapProperty = function (object, prop) {
                            var propType = typeof(object[prop]), descriptor = Object.getOwnPropertyDescriptor(object, prop);
                            if ((prop === 'getNotifier') || isAccessorDescriptor(descriptor) || (!descriptor.enumerable)) {
                                return false;
                            }
                            if ((object instanceof Array) && isNumeric(prop)) {
                                var idx = properties.length;
                                properties[idx] = prop;
                                values[idx] = object[prop];
                                return true;
                            }
                            (function (idx, prop) {
                                properties[idx] = prop;
                                values[idx] = object[prop];
                                Object.defineProperty(object, prop, {
                                    get: function () {
                                        return values[idx];
                                    },
                                    set: function (value) {
                                        if (!sameValue(values[idx], value)) {
                                            Object.getNotifier(object).queueUpdate(object, prop, 'updated', values[idx]);
                                            values[idx] = value;
                                        }
                                    }
                                });
                            })(properties.length, prop);
                            return true;
                        };
                        self._checkPropertyListing = function (dontQueueUpdates) {
                            var object = self._watching, keys = Object.keys(object), i = 0, l = keys.length;
                            var newKeys = [], oldKeys = properties.slice(0), updates = [];
                            var prop, queueUpdates = !dontQueueUpdates, propType, value, idx, aLength;

                            if (object instanceof Array) {
                                aLength = properties.length;
                            }

                            for (i = 0; i < l; i++) {
                                prop = keys[i];
                                value = object[prop];
                                propType = typeof(value);
                                if ((idx = properties.indexOf(prop)) === -1) {
                                    if (wrapProperty(object, prop) && queueUpdates) {
                                        self.queueUpdate(object, prop, 'new', null, object[prop]);
                                    }
                                } else {
                                    if ((object instanceof Array) && (isNumeric(prop))) {
                                        if (values[idx] !== value) {
                                            if (queueUpdates) {
                                                self.queueUpdate(object, prop, 'updated', values[idx], value);
                                            }
                                            values[idx] = value;
                                        }
                                    }
                                    oldKeys.splice(oldKeys.indexOf(prop), 1);
                                }
                            }

                            if (object instanceof Array && object.length !== aLength) {
                                if (queueUpdates) {
                                    self.queueUpdate(object, 'length', 'updated', aLength, object);
                                }
                            }

                            if (queueUpdates) {
                                l = oldKeys.length;
                                for (i = 0; i < l; i++) {
                                    idx = properties.indexOf(oldKeys[i]);
                                    self.queueUpdate(object, oldKeys[i], 'deleted', values[idx]);
                                    properties.splice(idx, 1);
                                    values.splice(idx, 1);
                                }
                                ;
                            }
                        };
                        self.addListener = function (callback) {
                            var idx = _listeners.indexOf(callback);
                            if (idx === -1) {
                                _listeners.push(callback);
                            }
                        };
                        self.removeListener = function (callback) {
                            var idx = _listeners.indexOf(callback);
                            if (idx > -1) {
                                _listeners.splice(idx, 1);
                            }
                        };
                        self.listeners = function () {
                            return _listeners;
                        };
                        self.queueUpdate = function (what, prop, type, was) {
                            this.queueUpdates([
                                {
                                    type: type,
                                    object: what,
                                    name: prop,
                                    oldValue: was
                                }
                            ]);
                        };
                        self.queueUpdates = function (updates) {
                            var self = this, i = 0, l = updates.length || 0, update;
                            for (i = 0; i < l; i++) {
                                update = updates[i];
                                _updates.push(update);
                            }
                            if (_updater) {
                                _clearCheckCallback(_updater);
                            }
                            _updater = _doCheckCallback(function () {
                                _updater = false;
                                self.deliverChangeRecords();
                            });
                        };
                        self.deliverChangeRecords = function () {
                            var i = 0, l = _listeners.length,
                            //keepRunning = true, removed as it seems the actual implementation doesn't do this
                            // In response to BUG #5
                                retval;
                            for (i = 0; i < l; i++) {
                                if (_listeners[i]) {
                                    if (_listeners[i] === console.log) {
                                        console.log(_updates);
                                    } else {
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
                            _updates = [];
                        };
                        self._checkPropertyListing(true);
                    };

                    var _notifiers = [], _indexes = [];
                    extend.getNotifier = function (O) {
                        var idx = _indexes.indexOf(O), notifier = idx > -1 ? _notifiers[idx] : false;
                        if (!notifier) {
                            idx = _indexes.length;
                            _indexes[idx] = O;
                            notifier = _notifiers[idx] = new Notifier(O);
                        }
                        return notifier;
                    };
                    extend.observe = function (O, callback) {
                        // For Bug 4, can't observe DOM elements tested against canry implementation and matches
                        if (!isElement(O)) {
                            return new Observer(O, callback);
                        }
                    };
                    extend.unobserve = function (O, callback) {
                        validateArguments(O, callback);
                        var idx = _indexes.indexOf(O),
                            notifier = idx > -1 ? _notifiers[idx] : false;
                        if (!notifier) {
                            return;
                        }
                        notifier.removeListener(callback);
                        if (notifier.listeners().length === 0) {
                            _indexes.splice(idx, 1);
                            _notifiers.splice(idx, 1);
                        }
                    };
                })(Object, this);
            }

        };

        return GDB;

    };

    //SUPPORT FOR MODULES
    if (typeof define === "function" && define.amd) {//AMD Module Support
        define( "gdb", ["jquery"], function(jquery) {
            return gdbFactory(jquery);
        });
    }
    else if (typeof exports === 'object') {
        module.exports = gdbFactory(require('jquery'));
    }
    else{//Normal Browser Support
        jQuery(function(){
            window.GDB = gdbFactory(window.jQuery);
        });
    }


}());
