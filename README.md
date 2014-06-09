Generic Data Binder v1.3.0 [<img src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif">](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=john@johnlouderback.com&lc=US&item_name=Generic%20Data%20Binder&currency_code=USD&bn=PP-DonationsBF:btn_donate_LG.gif:NonHosted)
===
##About GDB
Generic Data Binder (GDB) for jQuery is a framework agnostic and extremely easy to use 2 way data binder. GDB binds views and models in realtime with live two-way binding and no hefty framework necessary.

##Why Use GDB?
GDB is a simple to use, zero configuration (unless you want to), template engine and framework agnostic little plugin. Drop it in and initialize it. It just works. Updates to the model automagically update the view and changes in the view automagically update the model.
Finally, a plugin that allows for bi-directional live bindings between your view and model without the need to learn a hefty framework or change your current work flow.

##The GDB Advantage
* Works on all element types including ``contenteditable`` elements.
* Works with very complex models, even circular structures.
* Template engine agnostic. Use your favorite client side template engine. Don't compromise.
* Framework agnostic. Use a framework? Don't use a framework? Doesn't matter. GDB will seemlessly integrate in either situation.
* Can update in realtime. Not just ``onkeyup``, but as you type it. Works with context menu options such as cut, paste, and delete.
* Currently 3.77KB when gzipped and minified.
* Updates to elements, immediately update the model.
* Updates to the model, immediately update the bound and watching elements.

##Example Usage
###HTML or Template File
```html
<span data-bindto="teacher.name" contenteditable="true" > Ms. Trunchbull </span>
```

Use the "data-bindto" attribute in your templates or static HTML file and map the attribute to the location in the data model where the bound data exists. The format must be such that array indexes are specified in bracket notation (ie. "[0]") and object properties are written in dot notation (ie. ".propertyName"). Specifying object properties in backet notation (ie. "['propertyName']") will not work when the model is updated from within the code and so this is discouraged.
###JavaScript
```javascript
$(function(){ //GDB is only available once jQuery is ready.
  GDB({
    teacher: { 
      name: "Ms. Trunchbull" 
    } 
  }) ;
});
```

The above example shows the most simple implementation. GDB is initialized using the syntax 
```javascript
GDB( objectOfModels, objectOfUserOptions );
```
The first parameter is a JavaScript object literal whose properties are objects representing the data model.
The second parameter is an object containing user specified options.

Using the example above the element bound to the model will update the model in realtime as the data in the element changes. Vice-versa is also true. When data in the data model is changed, the element will update accordingly automatically.

##User Options
Property | Type | Default Value | Description
---------|------|---------------|------------
rootElementSelectorString | string | ``"body"`` | This property specifies what the root element is for whose children are monitored for changes and should be updated in realtime. Default is the body element, but specifying another element may be useful if using multiple instances of GDB for multiple templates.
realtime | boolean | ``true`` | This property specifies whether or not to update the model with changes as the user makes them. Such as: if the user is typing into an input, textarea, or contenteditable field the model will be updated with everything key press and alteration. If this value is set to ``false`` then the model will only be updated when the bound field loses focus.
renderOnInitialization | boolean | ``true`` | This property specifies if upon initialization GDB should set element values to be equal to values initalially in the model. If you are using a template engine, it may be faster to use the template engine to set these values, albeit this feature is more convenient.
dataBindToAttr | string | ``"data-bindto"`` | This property specifies the name of the attribute which contains the mapping to the location in the model to which a given element's data is bound. Changing this property's value may be useful in the event that there is a conflict with using the ``data-bindto`` attribute.
dataWatchingAttr | string | ``"data-watching"`` | This property specifies the name of the attribute used for specifying a comma separated list of locations in the model for which this element should react to changes to. Changes are reactived to with a data parsing function as mapped by the attribute specified by the ``dataParseWithAttr`` property.
dataParseWithAttr | string | ``"data-parsewith"`` | This property specifies the name of the attribute used for specifying a location in the model from where an object containing an "in" and/or "out" function exists. This object's "in" or "out" function will be called if the model or element changes respectively.
dataTemplateAttr | string | ``"data-gdb-template"`` | This property specifies the name of the attribute which is used for housing a very simple two-way template.
dataBindOnAttrPrefix | string | ``"data-bindon-"`` | This property specifies the beginning of name for the attribute which is used for specifying a location in the model which resolves to a function to be called on a given listened for event. An example usage is ``data-bindon-click="events.clickHandler"``. The callback function for this is passed the normal event data that jQuery would normally pass and also some added GDB sweetness such as: ``gdbBoundData``: the current value of the data the element might be bound to; ``gdbWatchingData``: An array of current data the element may be watching; ``gdbParent``: The parent location in the model which houses this callback function. ``this`` in the callback function's context is the HTML element the event occurred on, just like in jQuery.
listenForEvents | string | ``"click dblclick change input keydown mouseover mouseout keypress keyup mousedown mouseup focus blur"`` | This property specifies a space delimited list of events that will be listened to for event binding purposes.
templateOpeningDelimiter | string | ``"<<"`` | This property specifies the opening delimiter for inserting template data.
templateClosingDelimiter | string | ``">>"`` | This property specifies the closing delimiter for inserting template data.
bindAsTextOnly | boolean | ``false`` | This property specifies whether to use content of contenteditable elements as HTML or get the plain text.
debugLogging | boolean | ``false`` | When is property is set to ``true``, changes made to the model or view are recorded in the console via the console.log() function.
modelChangeCallback | function or null | ``null`` | This property may be set to a callback function which is fired when the model has been changed. This function is currently passed an object containing information about the change as an argument. The option contains:``locationPathString``: The location in the model as a string; ``$boundElements``: The bound elements as a jQuery collection; ``newValue``: The new value of the property; ``oldValue``: The old value of the property.
elementChangeCallback | function or null | ``null`` | This property may be set to a callback function which is fired when the model has been changed. This function is currently passed an object containing information about the change as an argument. The option contains:``locationPathString``: The location in the model as a string; ``$boundElement``: The element changed as a jQuery object; ``newValue``: The new value of the property.

All User Options are entirely optional.

##Public Instance Methods
Must be used only in GDB instances. These cannot be used statically.
Method | Returns | Description
-------|---------|------------
GDB.getBoundElementFromModelPath( ``pathString`` ) | ``jQuery`` Bound elements | Given a path to a location to the model, this method will return all elements bound to (via the ``data-bindto`` attribute).
GDB.getModelPathFromBoundElement( ``selectorString`` ) | ``string`` Model path | Given either a DOM element (not a jQuery collection) or a selector string, this method will return a path to which the given element is bound to via the ``data-bindto`` attribute.
GDB.getValueFromModelPath( ``pathString`` ) | ``any type`` Value from model | Given a path to a location to the model, this method will return the value location at that position in the model.
GDB.render() | Nothing | This method explicitly sets all current elements in the DOM's values to the current values in the model. This may be useful after significantly changing the DOM. If you are using a template engine for rendering, it may be faster to use the template engine to set these values, albeit this feature is more convenient. This method is not necessary for changes in the model.
GDB.getModelPathFromModelPart( ``modelPartObject`` ) | ``string`` Model path | Given an object or array in the model, this method will return a model path location string.
GDB.getBoundElementsForModelPart( ``modelPartObject`` ) | ``jQuery`` Bound elements | Given an object or array in the model, this method will return any element who have data bound to any properties of this object.
GDB.destroyInstance() | Nothing | Stops model observing and event listening, effectively destroying the instance.

##Element Attributes
Attribute Default Name | Expected Value(s) | Example Value | Description
-----------------------|-------------------|---------------|------------
data-bindto | A single path to a location in the model | ``teacher.name`` or ``teachers[6].students[0].name`` | This attribute is mapped to a location in the model to which the element is bound. Changes to this element are reflected in the model and changes in the model are reflected in this element. This attribute **should not** be used in conjuction with ``data-watching`` or ``data-parsewith``.
data-bindon-``(event name)`` | A single path to a location in the model where a callback function will be called for handling an event given an event name. | ``data-bindon-click="events.clickHandler"`` or  ``data-bindon-mouseout="buttons[13].mouseLeaves"`` |  The string which resolves to a callback function for this is passed the normal event data that jQuery would normally pass and also some added GDB sweetness such as: ``gdbBoundData``: the current value of the data the element might be bound to; ``gdbWatchingData``: An array of current data the element may be watching; ``gdbParent``: The parent location in the model which houses this callback function. ``this`` in the callback function's context is the HTML element the event occurred on, just like in jQuery.
data-watching | A comma separated list of one or more locations in the model | ``teacher.firstName``, ``teacher.firstName,teacher.lastName``, ``teacher[3].students[4].grade``, or ``teacher[3].students[4].grade, teacher[3].students[4].firstName, teacher[3].students[4].lastName`` | This attribute is mapped to one or more locations in the model separated by commas. If any of these properties in the model change, the element's ``data-parsewith`` attribute's object's ``in`` function is called. If this element is changed, the element's ``data-parsewith`` attribute's object's ``out`` function is called. This attribute **should not** be used in conjuction with ``data-bindto`` and **should be** used with ``data-parsewith``. **Note:** This attribute's value **should not** have a trailing space. You may, however, have a space after each comma, if you desire.
data-parsewith | A single path a location in the model of an object containing an ``in`` and/or ``out`` function | ``teacher.fullName`` or ``teacher[22].students[2].fullName`` | This attribute is mapped to a location in the model which contains an object which houses an ``in`` and/or ``out`` function. The ``in`` function is passed no arguments and is called when some of the watched data is changed. The ``in`` function should return the value which the element will be set to. The ``out`` function is passed an argument ``value`` which contains the value of the element. This function is called when the element changes its value. This function does not require a return value and should be used for setting data based on the elements value where appropriate. This attribute **should not** be used in conjuction with ``data-bindto`` and **should be** used with ``data-watching``.
data-gdb-template | A template composed of a mix of text and open and close delimiters containing a number. | ``<<1>> <<2>>`` or ``<<1>> likes to drink <<2>> with lots of <<3>>`` | This attribute is a very simple logicless template which can server as an alternative to a data parsing function. The number between the open and close delimiter should match the place number in the list of some data which is being watched. Templating is two-way, meaning if the templated element is edited from the element side in a way that matches the template, the template will update the model.

##Browser Support
Tested in Firefox, Chrome, and IE. Works in IE 9+.

##TODO
- [ ] Add CommonJS Support for Browserify
- [ ] Add TypeScript definitions
- [ ] Create complex use-case master example
- [x] Create "Generic Event Binding" capabilities
- [ ] Acheive better performance
- [x] Add simple templating functionality
- [x] Add ability to add data parsing functions
- [x] Add more and better examples
- [ ] Create pure JavaScript version if there is an interest
- [x] Upload initial stable release
- [x] Upload initial beta version

##Changelog
- v1.3 - 6/8/2014 - Added Generic Event Binding functionality, a few new useful public instance methods (including instance destruction), and three new examples.
- v1.2 - 4/26/2014 - Added data parsing function abilities, new public methods, AMD support, and added more examples.
- v1.0 - 3/29/2014 - Initial Stable Release. Fixed several minor bugs and added new callback function.
- v0.8 - 3/23/2014 - Uploaded initial version.
